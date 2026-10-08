import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const cache =
  process.env.CLARITY_BUILD_CACHE ||
  join(homedir(), "Library/Caches/Clarity/build");
const require = createRequire(join(cache, "loader.cjs"));
const evidence = process.env.CLARITY_QA_EVIDENCE || join(cache, "recent-chats");
await mkdir(evidence, { recursive: true });
const bundle = join(cache, "recent-chats-core.mjs");
await require("esbuild").build({
  stdin: {
    contents:
      "export {Store} from './src/main/store'; export {Files} from './src/main/files'; export {Agent} from '@earendil-works/pi-agent-core';",
    resolveDir: resolve("."),
  },
  outfile: bundle,
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
});
const { Store, Files } = await import(pathToFileURL(bundle));

async function eventually(check) {
  let failure;
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      return await check();
    } catch (error) {
      failure = error;
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  throw failure;
}

test(
  "Recent chats require a sent user turn and preserve drafts across reload and restart",
  { timeout: 90000 },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "clarity-recent-chats-"));
    await new Files(root).initialize();
    const store = new Store(root, join(cache, "output/worker.mjs"));
    await store.start();
    try {
      await store.put("settings", "default", {
        enabled: ["chat", "notes", "todos", "wiki"],
        model: "gpt-5.5",
        useDeviceLocation: false,
        locationRequested: true,
      });
      for (const [id, role] of [
        ["legacy-empty", null],
        ["assistant-only", "assistant"],
        ["existing-turn", "user"],
      ])
        await store.put("chats", id, {
          title: "New chat",
          status: "idle",
          grants: [],
          attachments: [],
          messages: role
            ? [
                {
                  role,
                  content: [{ type: "text", text: "Earlier message" }],
                  timestamp: 1,
                },
              ]
            : [],
        });
    } finally {
      await store.close();
    }
    let application;
    let page;
    const errors = [];
    const observations = {};
    const call = (method, args) =>
      page.evaluate(({ method, args }) => window.clarity.call(method, args), {
        method,
        args,
      });
    const list = () => call("chats.list");
    const message = () =>
      page.getByRole("textbox", { name: "Message", exact: true });
    const recent = () =>
      page
        .getByRole("navigation", { name: "Recent chats" })
        .getByRole("button");
    async function launch() {
      application = await require("playwright-core")._electron.launch({
        executablePath: require("electron"),
        args: [join(cache, "output/main.mjs")],
        env: { ...process.env, CLARITY_TEST_ROOT: root },
      });
      page = await application.firstWindow();
      page.setDefaultTimeout(8000);
      page.on("pageerror", (error) => errors.push(error.message));
      await page.locator(".sidebar").waitFor();
    }
    async function newChat() {
      const previous = (await call("bootstrap")).settings.lastChat;
      await page
        .getByRole("button", { name: "New chat", exact: true })
        .first()
        .click();
      return eventually(async () => {
        const id = (await call("bootstrap")).settings.lastChat;
        assert.ok(id && id !== previous);
        assert.equal(await message().inputValue(), "");
        return id;
      });
    }
    async function finish(fail = false) {
      await application.evaluate(
        (_electron, fail) => globalThis.recentChatQA.finish(fail),
        fail,
      );
      await eventually(async () =>
        assert.equal(
          await page.getByRole("button", { name: "Stop", exact: true }).count(),
          0,
        ),
      );
    }
    try {
      await launch();
      assert.deepEqual(
        (await list()).map((chat) => chat.id),
        ["existing-turn"],
      );
      assert.equal(await recent().count(), 1);
      let draftId;
      for (let index = 0; index < 4; index++) {
        draftId = await newChat();
        assert.equal(await recent().count(), 1);
        assert.equal((await list()).length, 1);
      }
      await message().fill("Unsent draft survives");
      await page.getByRole("button", { name: "Notes", exact: true }).click();
      await page.getByRole("button", { name: "Back", exact: true }).click();
      assert.equal(await message().inputValue(), "Unsent draft survives");
      await page.reload();
      await page.locator(".sidebar").waitFor();
      await eventually(async () =>
        assert.equal(await message().inputValue(), "Unsent draft survives"),
      );
      await assert.rejects(
        call("chats.send", {
          id: draftId,
          text: "Cannot prepare without sign-in",
        }),
        /Connect Codex/,
      );
      assert.equal((await list()).length, 1);
      assert.equal(
        (await call("chats.get", { id: draftId })).messages.length,
        0,
      );
      observations.emptyClicks = 4;
      observations.hiddenAfterPreparationFailure = true;

      // Install only a disposable credential; the model prompt is controlled below.
      await application.evaluate(async ({ safeStorage }, root) => {
        const bytes = safeStorage.encryptString(
          JSON.stringify({
            codex: { access: "fixture-only", expires: Date.now() + 3600000 },
          }),
        );
        await process
          .getBuiltinModule("fs/promises")
          .writeFile(
            process
              .getBuiltinModule("path")
              .join(root, ".clarity", "credentials.bin"),
            bytes,
          );
      }, root);
      await application.close();
      await launch();
      await eventually(async () =>
        assert.equal(await message().inputValue(), "Unsent draft survives"),
      );
      assert.equal(await recent().count(), 1);
      observations.draftPreservedAfterRestart = true;
      await application.evaluate((_electron, bundle) => {
        const { Agent } = process
          .getBuiltinModule("module")
          .createRequire(bundle)(bundle);
        globalThis.recentChatQA = { prompts: [] };
        Agent.prototype.prompt = async function (prompt) {
          this.state.messages.push(prompt);
          globalThis.recentChatQA.prompts.push(prompt);
          const fail = await new Promise((done) => {
            globalThis.recentChatQA.finish = done;
          });
          if (fail) throw new Error("Controlled response failure");
        };
      }, bundle);
      await message().fill("First sent turn");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await eventually(async () => {
        assert.equal(await recent().count(), 2);
        const [chat] = await list();
        assert.equal(chat.id, draftId);
        assert.equal(chat.title, "First sent turn");
        assert.equal(chat.status, "running");
      });
      await finish(true);
      assert.equal((await call("chats.get", { id: draftId })).status, "error");
      assert.equal(await recent().count(), 2);
      observations.firstTurnListedWhileRunning = true;
      observations.responseFailureRemainsListed = true;
      await message().fill("Second sent turn");
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await eventually(async () =>
        assert.equal(
          await application.evaluate(
            () => globalThis.recentChatQA.prompts.length,
          ),
          2,
        ),
      );
      await finish();
      assert.equal(await recent().count(), 2);

      const attachmentChat = await newChat();
      const attachment = await call("attachments.add", {
        name: "Fixture.txt",
        mime: "text/plain",
        bytes: [72, 105],
      });
      await application.evaluate(
        ({ dialog }, path) => {
          dialog.showOpenDialog = async () => ({
            canceled: false,
            filePaths: [path],
          });
        },
        join(root, "Attachments", attachment.id, attachment.name),
      );
      await page
        .getByRole("button", { name: "Attach files", exact: true })
        .click();
      assert.equal(await recent().count(), 2);
      await page.getByRole("button", { name: "Send", exact: true }).click();
      await eventually(async () => {
        assert.equal(await recent().count(), 3);
        assert.equal((await list())[0].id, attachmentChat);
      });
      await finish();
      observations.attachmentOnlyTurnListed = true;
      await application.close();
      await launch();
      await eventually(async () => assert.equal(await recent().count(), 3));
      const saved = await list();
      assert.deepEqual(
        saved.map((chat) => chat.id),
        [attachmentChat, draftId, "existing-turn"],
      );
      assert.equal(
        (await call("chats.get", { id: draftId })).messages.filter(
          (message) => message.role === "user",
        ).length,
        2,
      );
      observations.finalRecentTitles = saved.map((chat) => chat.title);
      observations.turnsPreservedAfterRestart = true;
      assert.deepEqual(errors, []);
      await page.screenshot({ path: join(evidence, "recent-chats.png") });
    } finally {
      observations.rendererErrors = errors;
      await writeFile(
        join(evidence, "recent-chats.json"),
        JSON.stringify(observations, null, 2),
      );
      await application
        ?.evaluate(() => globalThis.recentChatQA?.finish?.(false))
        .catch(() => {});
      await application?.close();
    }
  },
);
