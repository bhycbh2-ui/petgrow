export default function petgrowHomeBootUnblock20260828() {
  const authStateNeedle = '  const [authChecked, setAuthChecked] = useState(false);';
  const bootGateNeedle = '  if (!loaded || !authChecked) return (';

  return {
    name: 'petgrow-home-boot-unblock-20260828',
    enforce: 'pre',
    transform(code, id) {
      const cleanId = String(id || '').split('?')[0].replace(/\\/g, '/');
      if (!cleanId.endsWith('/src/App.jsx')) return null;

      if (!code.includes(authStateNeedle)) {
        throw new Error('[petgrow-home-boot-unblock] auth state marker not found');
      }
      if (!code.includes(bootGateNeedle)) {
        throw new Error('[petgrow-home-boot-unblock] boot gate marker not found');
      }

      let next = code.replace(
        authStateNeedle,
        `${authStateNeedle}\n\n  // 홈은 인증 API 상태와 무관하게 열리고, 인증 확인이 비정상적으로 지연될 때도\n  // 전체 앱이 스켈레톤에 영구 고정되지 않도록 안전 종료 타이머를 둡니다.\n  useEffect(() => {\n    const bootReleaseTimer = window.setTimeout(() => {\n      setAuthChecked(true);\n      setLoaded(true);\n    }, 3500);\n    return () => window.clearTimeout(bootReleaseTimer);\n  }, []);`
      );

      next = next.replace(
        bootGateNeedle,
        '  if (view !== "home" && (!loaded || !authChecked)) return ('
      );

      return { code: next, map: null };
    },
  };
}
