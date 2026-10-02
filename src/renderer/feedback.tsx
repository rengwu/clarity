import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import * as Toast from '@radix-ui/react-toast';
import { Icon } from './icons';

type Severity = 'info' | 'success' | 'warning' | 'error';
export type FeedbackMessage = {
  id?: string;
  severity: Severity;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  placement?: 'toast' | 'banner';
};
type Message = FeedbackMessage & {
  id: string;
  version: number;
  remaining: number;
};
type Feedback = {
  notify: (message: FeedbackMessage) => string;
  dismiss: (id: string) => void;
  clear: () => void;
  error: (failure: unknown, options?: Partial<Omit<FeedbackMessage, 'severity'>>) => void;
};
const FeedbackContext = createContext<Feedback | null>(null);
const BannerContext = createContext<React.ReactNode>(null);
const severityIcon = {
  info: 'info',
  success: 'check',
  warning: 'warning',
  error: 'warning',
};

export function errorMessage(failure: unknown) {
  if (failure instanceof Error) return failure.message || 'Please try again.';
  return typeof failure === 'string' && failure.trim() ? failure : 'Please try again.';
}

export function Notice({
  severity = 'error',
  title,
  children,
  actions,
  className = '',
  id,
}: {
  severity?: Severity;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  if (!title && !children) return null;
  return (
    <div
      id={id}
      className={`notice ${className}`}
      data-severity={severity}
      role={severity === 'error' ? 'alert' : 'status'}
    >
      <Icon name={severityIcon[severity]} />
      <div className="notice-copy">
        {title && <strong>{title}</strong>}
        {children && <div>{children}</div>}
      </div>
      {actions && <div className="notice-actions">{actions}</div>}
    </div>
  );
}

export function useFeedback() {
  const feedback = useContext(FeedbackContext);
  if (!feedback) throw new Error('FeedbackProvider is missing.');
  return feedback;
}

export function FeedbackBanner() {
  return useContext(BannerContext);
}

function FeedbackToast({
  message,
  dismiss,
  active,
}: {
  message: Message;
  dismiss: (id: string) => void;
  active: boolean;
}) {
  // Keep unread time when a native modal or hidden window suspends the Radix host.
  useEffect(() => {
    if (!active || !Number.isFinite(message.remaining)) return;
    const started = performance.now();
    const timer = window.setTimeout(() => dismiss(message.id), message.remaining);
    return () => {
      window.clearTimeout(timer);
      message.remaining = Math.max(1, message.remaining - (performance.now() - started));
    };
  }, [message, dismiss, active]);
  return (
    <Toast.Root
      className="toast notice"
      data-severity={message.severity}
      data-paused={!active}
      duration={Infinity}
      type={message.severity === 'error' ? 'foreground' : 'background'}
      onOpenChange={(open) => {
        if (!open) dismiss(message.id);
      }}
      onEscapeKeyDown={(event) => {
        if (!(event.target instanceof Element) || !event.target.closest('.toast-viewport'))
          event.preventDefault();
      }}
    >
      <Icon name={severityIcon[message.severity]} />
      <div className="notice-copy">
        <Toast.Title>{message.title}</Toast.Title>
        {message.description && (
          <Toast.Description className="toast-description">{message.description}</Toast.Description>
        )}
      </div>
      {message.action && (
        <Toast.Action asChild altText={message.action.label}>
          <button className="toast-action" onClick={message.action.onClick}>
            {message.action.label}
          </button>
        </Toast.Action>
      )}
      <Toast.Close className="icon-button quiet" aria-label="Dismiss notification">
        <Icon name="close" size={14} />
      </Toast.Close>
    </Toast.Root>
  );
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [modal, setModal] = useState<HTMLDialogElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [availability, setAvailability] = useState(() => ({
    visible: !document.hidden,
    active: document.hasFocus(),
  }));
  const previousFocus = useRef<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setHovered(false);
    setFocused(false);
  }, [modal, availability.visible]);
  const version = useRef(0);
  const dismiss = useCallback((id: string) => {
    setMessages((current) => current.filter((message) => message.id !== id));
  }, []);
  const clear = useCallback(() => setMessages([]), []);
  const notify = useCallback((input: FeedbackMessage) => {
    const id = input.id || [input.severity, input.title, input.description].join(':');
    const message: Message = {
      ...input,
      id,
      version: ++version.current,
      remaining: input.action || ['warning', 'error'].includes(input.severity) ? Infinity : 6000,
    };
    setMessages((current) => {
      const existing = current.find((item) => item.id === id);
      if (
        existing &&
        existing.title === input.title &&
        existing.description === input.description &&
        existing.severity === input.severity &&
        existing.action === input.action &&
        existing.placement === input.placement
      )
        return current;
      return existing
        ? current.map((item) => (item.id === id ? message : item))
        : [...current, message];
    });
    return id;
  }, []);
  const error = useCallback(
    (failure: unknown, options?: Partial<Omit<FeedbackMessage, 'severity'>>) => {
      notify({
        title: 'Couldn’t complete the action',
        description: errorMessage(failure),
        ...options,
        severity: 'error',
      });
    },
    [notify],
  );
  const feedback = useMemo(
    () => ({ notify, dismiss, clear, error }),
    [notify, dismiss, clear, error],
  );

  useEffect(() => {
    const updateModal = () => {
      const dialogs = document.querySelectorAll<HTMLDialogElement>('dialog:modal');
      setModal(dialogs.item(dialogs.length - 1));
    };
    const observer = new MutationObserver(updateModal);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    updateModal();
    let nativeStatus: { visible: boolean; focused: boolean } | undefined;
    let receivedWindowEvent = false;
    let disposed = false;
    const visibility = () =>
      setAvailability({
        visible: !document.hidden && (nativeStatus?.visible ?? true),
        active: !document.hidden && (nativeStatus?.focused ?? document.hasFocus()),
      });
    const unsubscribe = window.clarity.subscribe((event) => {
      if (event.type !== 'window') return;
      receivedWindowEvent = true;
      nativeStatus = event.data;
      visibility();
    });
    void window.clarity
      .call<{ visible: boolean; focused: boolean }>('window.status')
      .then((status) => {
        if (disposed || receivedWindowEvent) return;
        nativeStatus = status;
        visibility();
      })
      .catch(() => {});
    const focus = (event: FocusEvent) => {
      if (event.target instanceof HTMLElement && !event.target.closest('[data-feedback-host]'))
        previousFocus.current = event.target;
    };
    window.addEventListener('focus', visibility);
    window.addEventListener('blur', visibility);
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('focusin', focus);
    return () => {
      disposed = true;
      unsubscribe();
      observer.disconnect();
      window.removeEventListener('focus', visibility);
      window.removeEventListener('blur', visibility);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('focusin', focus);
    };
  }, []);

  const toasts = messages.filter((message) => message.placement !== 'banner').slice(0, 3);
  const banners = messages.filter((message) => message.placement === 'banner');
  const banner = banners.length > 0 && (
    <div className="feedback-banners">
      {banners.map((message) => (
        <Notice
          key={message.id}
          severity={message.severity}
          title={message.title}
          actions={
            message.action && (
              <button onClick={message.action.onClick}>{message.action.label}</button>
            )
          }
        >
          {message.description}
        </Notice>
      ))}
    </div>
  );
  const hadToasts = useRef(false);
  useLayoutEffect(() => {
    if (
      hadToasts.current &&
      !toasts.length &&
      document.activeElement?.closest('[data-feedback-host]') &&
      previousFocus.current?.isConnected
    )
      previousFocus.current.focus();
    hadToasts.current = toasts.length > 0;
  }, [toasts.length]);

  return (
    <FeedbackContext.Provider value={feedback}>
      <BannerContext.Provider value={modal ? null : banner}>{children}</BannerContext.Provider>
      {modal && banner && createPortal(banner, modal)}
      {!modal && availability.visible && (
        <div
          data-feedback-host=""
          className="feedback-host"
          onPointerEnter={() => setHovered(true)}
          onPointerMove={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
          }}
        >
          <Toast.Provider label="Notification" duration={6000}>
            {toasts.map((message) => (
              <FeedbackToast
                key={`${message.id}:${message.version}`}
                message={message}
                active={availability.active && !hovered && !focused}
                dismiss={dismiss}
              />
            ))}
            <Toast.Viewport
              className="toast-viewport"
              label="Notifications (F8)"
              title="Notifications · F8"
            />
          </Toast.Provider>
        </div>
      )}
    </FeedbackContext.Provider>
  );
}
