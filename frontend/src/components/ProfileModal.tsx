import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Exercise, Profile, WorkoutsByDay } from "../types";

type GoogleIdResponse = { credential: string };

function loadGsiScript(): Promise<void> {
  const id = "gsi-client-script";
  const w = window as unknown as { google?: { accounts?: unknown } };
  if (w.google?.accounts) return Promise.resolve();
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("gsi")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.id = id;
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("gsi"));
    document.head.appendChild(s);
  });
}

/** Отдельные статические страницы (без SPA-хедера). */
const PRIVACY_DOC_HREF = "/privacy.html";
const TERMS_DOC_HREF = "/terms.html";

function LegalFooter() {
  return (
    <div className="profile-auth-legal">
      <a href={PRIVACY_DOC_HREF} target="_blank" rel="noopener noreferrer" className="profile-auth-inline-link">
        Политика конфиденциальности
      </a>
      <span className="profile-auth-legal-sep muted" aria-hidden="true">
        ·
      </span>
      <a href={TERMS_DOC_HREF} target="_blank" rel="noopener noreferrer" className="profile-auth-inline-link">
        Условия пользования
      </a>
    </div>
  );
}

type AuthScreen = "login-email" | "login-password" | "register" | "forgot" | "reset";

function isValidEmail(value: string) {
  const v = value.trim();
  return v.length > 0 && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

type ProfileModalProps = {
  profile: Profile;
  favorites: Exercise[];
  workouts: WorkoutsByDay;
  apiBaseUrl: string;
  onClose: () => void;
  onLogout: () => void;
  onLogin: (login: string, password: string) => Promise<string | null>;
  onCheckLoginEmail: (email: string) => Promise<string | null>;
  onRegister: (payload: { nickname: string; password: string; email: string }) => Promise<string | null>;
  onGoogleSignIn: (credential: string) => Promise<string | null>;
  onRequestPasswordReset: (nicknameOrEmail: string) => Promise<{ error: string | null; message?: string; resetToken?: string }>;
  onResetPassword: (token: string, password: string) => Promise<string | null>;
  onRemoveFavorite?: (exercise: Exercise) => void;
};

export function ProfileModal({
  profile,
  favorites,
  workouts,
  apiBaseUrl,
  onClose,
  onLogout,
  onLogin,
  onCheckLoginEmail,
  onRegister,
  onGoogleSignIn,
  onRequestPasswordReset,
  onResetPassword,
  onRemoveFavorite
}: ProfileModalProps) {
  const savedDays = Object.values(workouts).filter((list) => list.length > 0).length;
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login-email");
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const googleHiddenHostRef = useRef<HTMLDivElement>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [regNick, setRegNick] = useState("");
  const [regPass, setRegPass] = useState("");
  const [regPass2, setRegPass2] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [forgotNick, setForgotNick] = useState("");
  const [forgotInfo, setForgotInfo] = useState("");
  const [loginBanner, setLoginBanner] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetPass, setResetPass] = useState("");
  const [resetPass2, setResetPass2] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [loginPasswordFx, setLoginPasswordFx] = useState<"default" | "after-email">("default");

  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prev;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, []);

  useEffect(() => {
    if (profile.authenticated || (authScreen !== "login-email" && authScreen !== "login-password")) return;
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch(`${apiBaseUrl}/api/auth/google-client-id`);
        const d = (await r.json()) as { clientId?: string };
        if (cancelled) return;
        const cid = typeof d.clientId === "string" && d.clientId.trim().length > 0 ? d.clientId.trim() : null;
        setGoogleClientId(cid);
      } catch {
        if (!cancelled) setGoogleClientId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profile.authenticated, authScreen, apiBaseUrl]);

  useEffect(() => {
    if (profile.authenticated || authScreen !== "login-email" || !googleClientId) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      const host = googleHiddenHostRef.current;
      if (!host || cancelled) return;
      host.innerHTML = "";
      try {
        await loadGsiScript();
        if (cancelled || !googleHiddenHostRef.current) return;
        const w = window as unknown as {
          google?: {
            accounts: {
              id: {
                initialize: (cfg: { client_id: string; callback: (r: GoogleIdResponse) => void }) => void;
                renderButton: (el: HTMLElement, opts: Record<string, string | number>) => void;
              };
            };
          };
        };
        const gid = w.google?.accounts?.id;
        const h = googleHiddenHostRef.current;
        if (!gid || !h) return;
        h.innerHTML = "";
        gid.initialize({
          client_id: googleClientId,
          callback: (resp: GoogleIdResponse) => {
            if (!resp?.credential) return;
            void (async () => {
              setPending(true);
              clearErrors();
              try {
                const err = await onGoogleSignIn(resp.credential);
                if (err) setFormError(err);
                else onClose();
              } finally {
                setPending(false);
              }
            })();
          }
        });
        gid.renderButton(h, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          locale: "ru",
          logo_alignment: "left",
          width: 320
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
      if (googleHiddenHostRef.current) googleHiddenHostRef.current.innerHTML = "";
    };
  }, [googleClientId, authScreen, profile.authenticated, onGoogleSignIn, onClose]);

  function triggerGoogleSignIn() {
    const root = googleHiddenHostRef.current;
    if (!root) return;
    const inner =
      (root.querySelector('[role="button"]') as HTMLElement | null) ||
      (root.querySelector("iframe")?.parentElement?.querySelector('[role="button"]') as HTMLElement | null);
    inner?.click();
  }

  function clearErrors() {
    setFormError("");
    setForgotInfo("");
  }

  async function submitContinueEmail() {
    clearErrors();
    const email = loginEmail.trim();
    if (!isValidEmail(email)) {
      setFormError("Укажите корректный email.");
      return;
    }
    setPending(true);
    try {
      const err = await onCheckLoginEmail(email);
      if (err) {
        setFormError(err);
        return;
      }
      setLoginEmail(email);
      setLoginPass("");
      setLoginPasswordFx("after-email");
      setAuthScreen("login-password");
    } finally {
      setPending(false);
    }
  }

  async function submitPasswordLogin() {
    clearErrors();
    setLoginBanner("");
    const email = loginEmail.trim();
    if (!isValidEmail(email)) {
      setFormError("Укажите корректный email.");
      setAuthScreen("login-email");
      return;
    }
    setPending(true);
    try {
      const err = await onLogin(email, loginPass);
      if (err) setFormError(err);
      else {
        setLoginPass("");
        onClose();
      }
    } finally {
      setPending(false);
    }
  }

  async function submitRegister() {
    clearErrors();
    if (!isValidEmail(regEmail)) {
      setFormError("Укажите корректный email.");
      return;
    }
    if (regPass !== regPass2) {
      setFormError("Пароли не совпадают.");
      return;
    }
    setPending(true);
    try {
      const err = await onRegister({
        nickname: regNick.trim(),
        password: regPass,
        email: regEmail.trim()
      });
      if (err) setFormError(err);
      else {
        setRegPass("");
        setRegPass2("");
        onClose();
      }
    } finally {
      setPending(false);
    }
  }

  async function submitForgot() {
    clearErrors();
    const nick = forgotNick.trim();
    if (!nick) {
      setFormError("Укажите имя или email.");
      return;
    }
    setPending(true);
    try {
      const result = await onRequestPasswordReset(nick);
      if (result.error) {
        setFormError(result.error);
        return;
      }
      if (result.resetToken) {
        setResetToken(result.resetToken);
        setAuthScreen("reset");
        setForgotInfo(result.message || "");
        return;
      }
      setForgotInfo(result.message || "Запрос принят. Если имя существует, следуйте инструкциям на сервере или в письме.");
    } finally {
      setPending(false);
    }
  }

  async function submitReset() {
    clearErrors();
    if (resetPass !== resetPass2) {
      setFormError("Пароли не совпадают.");
      return;
    }
    if (!resetToken.trim()) {
      setFormError("Введите код сброса.");
      return;
    }
    setPending(true);
    try {
      const err = await onResetPassword(resetToken.trim(), resetPass);
      if (err) setFormError(err);
      else {
        setResetPass("");
        setResetPass2("");
        setResetToken("");
        setAuthScreen("login-email");
        setLoginBanner("Пароль обновлён. Войдите с новым паролем.");
      }
    } finally {
      setPending(false);
    }
  }

  const subtitle = profile.authenticated
    ? profile.name
    : authScreen === "register"
      ? "Регистрация"
      : authScreen === "forgot"
        ? "Восстановление пароля"
        : authScreen === "reset"
          ? "Новый пароль"
          : authScreen === "login-password"
            ? "Вход"
            : "Вход";

  return (
    <div className="modal-backdrop profile-auth-backdrop" onClick={onClose} role="presentation">
      <div className="modal profile-modal-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h2 style={{ margin: 0 }}>Личный кабинет</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {subtitle}
            </p>
          </div>
          <div className="profile-modal-header-actions">
            {profile.authenticated ? (
              <button type="button" className="btn profile-header-logout" onClick={onLogout}>
                Выйти
              </button>
            ) : null}
            <button type="button" className="close-btn" onClick={onClose} aria-label="Закрыть">
              ✕
            </button>
          </div>
        </div>
        <div className="modal-body">
          {!profile.authenticated ? (
            <div className="profile-auth">
              {authScreen === "login-email" ? (
                <div key="login-email-screen" className="profile-auth-screen profile-auth-screen-enter">
                  <div className="profile-auth-form profile-auth-form-tight">
                    <label className="profile-auth-label">
                      Электронная почта
                      <input
                        className="profile-auth-input"
                        type="email"
                        inputMode="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void submitContinueEmail();
                          }
                        }}
                        placeholder="Ваш адрес электронной почты"
                        autoComplete="email"
                      />
                    </label>
                    <button type="button" className="btn profile-auth-continue" disabled={pending} onClick={() => void submitContinueEmail()}>
                      Продолжить
                    </button>
                    {googleClientId ? (
                      <button
                        type="button"
                        className="profile-google-btn profile-google-after-continue"
                        disabled={pending}
                        onClick={() => triggerGoogleSignIn()}
                        aria-label="Продолжить с Google"
                      >
                        <svg className="profile-google-btn-icon" width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                          <path
                            fill="#EA4335"
                            d="M24 9.5c3.46 0 6.66 1.22 9 3.22l6.75-6.75C34.9 2.36 29.7 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                          />
                          <path
                            fill="#4285F4"
                            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.62 3.11-2.48 5.75-5.28 7.53l7.98 6.19C44.43 37.18 46.98 31.55 46.98 24.55z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z"
                          />
                          <path
                            fill="#34A853"
                            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.98-6.19c-2.21 1.49-5.03 2.37-7.91 2.37-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                          />
                        </svg>
                        Продолжить с Google
                      </button>
                    ) : null}
                  </div>
                  <div ref={googleHiddenHostRef} className="profile-google-hidden-host" aria-hidden="true" />
                  {loginBanner ? <p className="profile-auth-hint profile-auth-hint-success">{loginBanner}</p> : null}
                  {formError ? <p className="profile-auth-error">{formError}</p> : null}
                  <p className="profile-auth-footer-row muted">
                    Нет аккаунта?{" "}
                    <button
                      type="button"
                      className="profile-auth-inline-link"
                      onClick={() => {
                        clearErrors();
                        setLoginBanner("");
                        setAuthScreen("register");
                      }}
                    >
                      Регистрация
                    </button>
                  </p>
                  <LegalFooter />
                </div>
              ) : authScreen === "login-password" ? (
                <div
                  key="login-password-screen"
                  className={`profile-auth-screen ${
                    loginPasswordFx === "after-email" ? "profile-auth-screen-enter-password" : "profile-auth-screen-enter"
                  }`}
                >
                  <div className="profile-auth-form profile-auth-form-tight">
                    <div className="profile-auth-label profile-password-field">
                      <div className="profile-password-label-row">
                        <span id="login-password-label">Пароль</span>
                        <button
                          type="button"
                          className="profile-auth-link profile-password-forgot-inline"
                          disabled={pending}
                          onClick={() => {
                            clearErrors();
                            setForgotNick(loginEmail.trim());
                            setLoginPasswordFx("default");
                            setAuthScreen("forgot");
                          }}
                        >
                          Забыли пароль?
                        </button>
                      </div>
                      <input
                        id="login-password-input"
                        className="profile-auth-input"
                        type="password"
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            void submitPasswordLogin();
                          }
                        }}
                        autoComplete="current-password"
                        aria-labelledby="login-password-label"
                      />
                    </div>
                    <div className="profile-login-password-actions">
                      <button type="button" className="btn primary profile-auth-submit-wide" disabled={pending} onClick={() => void submitPasswordLogin()}>
                        Войти
                      </button>
                      <button
                        type="button"
                        className="btn profile-auth-continue profile-auth-back-btn profile-auth-back-btn-full"
                        disabled={pending}
                        onClick={() => {
                          clearErrors();
                          setLoginPass("");
                          setLoginPasswordFx("default");
                          setAuthScreen("login-email");
                        }}
                      >
                        Назад
                      </button>
                    </div>
                  </div>
                  {loginBanner ? <p className="profile-auth-hint profile-auth-hint-success">{loginBanner}</p> : null}
                  {formError ? <p className="profile-auth-error">{formError}</p> : null}
                  <LegalFooter />
                </div>
              ) : authScreen === "register" ? (
                <div key="register-screen" className="profile-auth-screen profile-auth-screen-enter">
                  <div className="profile-auth-form">
                    <label className="profile-auth-label">
                      Имя
                      <input
                        className="profile-auth-input"
                        value={regNick}
                        onChange={(e) => setRegNick(e.target.value)}
                        autoComplete="username"
                        placeholder="Введите ваше имя"
                      />
                    </label>
                    <label className="profile-auth-label">
                      Email
                      <input
                        className="profile-auth-input"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="Введите ваш email"
                      />
                    </label>
                    <label className="profile-auth-label">
                      Пароль
                      <input
                        className="profile-auth-input"
                        type="password"
                        value={regPass}
                        onChange={(e) => setRegPass(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Введите ваш пароль"
                      />
                    </label>
                    <label className="profile-auth-label">
                      Подтвердить пароль
                      <input
                        className="profile-auth-input"
                        type="password"
                        value={regPass2}
                        onChange={(e) => setRegPass2(e.target.value)}
                        autoComplete="new-password"
                        placeholder="Повторите пароль"
                      />
                    </label>
                    <button
                      type="button"
                      className="btn primary profile-auth-submit profile-auth-submit-wide"
                      disabled={pending}
                      onClick={() => void submitRegister()}
                    >
                      Создать аккаунт
                    </button>
                  </div>
                  {formError ? <p className="profile-auth-error">{formError}</p> : null}
                  <p className="profile-auth-footer-row muted">
                    Уже есть аккаунт?{" "}
                    <button
                      type="button"
                      className="profile-auth-inline-link"
                      onClick={() => {
                        clearErrors();
                        setAuthScreen("login-email");
                      }}
                    >
                      Войти
                    </button>
                  </p>
                  <LegalFooter />
                </div>
              ) : authScreen === "forgot" ? (
                <>
                  <p className="muted profile-auth-intro">
                    Укажите имя или email. Если включена выдача кода для разработки, после запроса откроется форма нового пароля; иначе следуйте
                    инструкциям администратора или письму на email.
                  </p>
                  <div className="profile-auth-form">
                    <label className="profile-auth-label">
                      Имя или email
                      <input
                        className="profile-auth-input"
                        type="text"
                        value={forgotNick}
                        onChange={(e) => setForgotNick(e.target.value)}
                        autoComplete="username"
                      />
                    </label>
                    <button type="button" className="btn primary profile-auth-submit" disabled={pending} onClick={() => void submitForgot()}>
                      Запросить сброс пароля
                    </button>
                  </div>
                  <div className="profile-auth-links-block">
                    <button
                      type="button"
                      className="profile-auth-link"
                      onClick={() => {
                        clearErrors();
                        setAuthScreen("reset");
                      }}
                    >
                      У меня уже есть код сброса
                    </button>
                  </div>
                  {forgotInfo ? <p className="profile-auth-hint">{forgotInfo}</p> : null}
                  {formError ? <p className="profile-auth-error">{formError}</p> : null}
                  <button
                    type="button"
                    className="profile-auth-back"
                    onClick={() => {
                      clearErrors();
                      setLoginPasswordFx("default");
                      if (isValidEmail(loginEmail.trim())) setAuthScreen("login-password");
                      else setAuthScreen("login-email");
                    }}
                  >
                    ← Назад
                  </button>
                  <LegalFooter />
                </>
              ) : (
                <>
                  <p className="muted profile-auth-intro">
                    Вставьте код сброса и задайте новый пароль (не меньше 6 букв и хотя бы одна цифра).
                  </p>
                  <div className="profile-auth-form">
                    <label className="profile-auth-label">
                      Код сброса
                      <input
                        className="profile-auth-input profile-auth-input-mono"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        autoComplete="one-time-code"
                      />
                    </label>
                    <label className="profile-auth-label">
                      Новый пароль
                      <input className="profile-auth-input" type="password" value={resetPass} onChange={(e) => setResetPass(e.target.value)} autoComplete="new-password" />
                    </label>
                    <label className="profile-auth-label">
                      Повтор пароля
                      <input className="profile-auth-input" type="password" value={resetPass2} onChange={(e) => setResetPass2(e.target.value)} autoComplete="new-password" />
                    </label>
                    <button type="button" className="btn primary profile-auth-submit" disabled={pending} onClick={() => void submitReset()}>
                      Сохранить новый пароль
                    </button>
                  </div>
                  {formError ? <p className="profile-auth-error">{formError}</p> : null}
                  <button
                    type="button"
                    className="profile-auth-back"
                    onClick={() => {
                      clearErrors();
                      setAuthScreen("login-email");
                    }}
                  >
                    ← Ко входу
                  </button>
                  <LegalFooter />
                </>
              )}
            </div>
          ) : (
            <>
              <p className="muted">Имя: {profile.nickname}</p>
              {profile.email ? <p className="muted">Email: {profile.email}</p> : null}
              <p className="profile-auth-logged-legal">
                <a href={PRIVACY_DOC_HREF} target="_blank" rel="noopener noreferrer" className="profile-auth-inline-link">
                  Политика конфиденциальности
                </a>
                <span className="profile-auth-legal-sep muted" aria-hidden="true">
                  {" "}
                  ·{" "}
                </span>
                <a href={TERMS_DOC_HREF} target="_blank" rel="noopener noreferrer" className="profile-auth-inline-link">
                  Условия пользования
                </a>
              </p>
              <h3>Избранные упражнения</h3>
              {favorites.length === 0 ? (
                <p className="empty">Пока нет добавленных упражнений.</p>
              ) : (
                <div className="tags filter-tags">
                  {favorites.map((item) => (
                    <span key={item.id} className="chip profile-fav-chip">
                      {item.name}
                      {onRemoveFavorite ? (
                        <button type="button" className="profile-fav-remove" onClick={() => onRemoveFavorite(item)} aria-label="Убрать из избранного">
                          ×
                        </button>
                      ) : null}
                    </span>
                  ))}
                </div>
              )}
              <h3>Моя тренировка</h3>
              <p className="muted">Заполнено тренировочных дней: {savedDays}</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
