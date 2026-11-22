// Faux services de sauvegarde injectés avant le chargement de la page (aucun appel réseau).
// - Supabase : le jeu n'injecte la bibliothèque que si `window.supabase` est absent ; on fournit un faux client
//   qui stocke la table `progress` en mémoire (window.__fake.rows) et journalise les appels (window.__fake.calls).
// - Compte Claude : faux `window.claude.use('db' | 'user')`, document stocké dans window.__fake.doc.
// Ces fonctions sont sérialisées par Playwright : elles ne doivent dépendre que de leur argument.

export function fauxSupabase({ session, remote }) {
  const F = (window.__fake = { rows: {}, calls: [], listeners: [] });
  if (session && remote !== undefined) F.rows[session.user.id] = remote;
  let ses = session || null;
  const emit = (ev, s) => F.listeners.forEach(cb => cb(ev, s));
  const client = {
    auth: {
      getSession: async () => ({ data: { session: ses }, error: null }),
      onAuthStateChange: cb => {
        F.listeners.push(cb);
        return { data: { subscription: { unsubscribe() {} } } };
      },
      signOut: async () => {
        F.calls.push('signOut');
        ses = null;
        emit('SIGNED_OUT', null);
        return { error: null };
      },
      signInWithPassword: async ({ email }) => {
        F.calls.push('signIn:' + email);
        ses = { user: { id: 'u-' + email, email } };
        emit('SIGNED_IN', ses);
        return { data: { session: ses }, error: null };
      },
    },
    from: table => {
      const q = { uid: null };
      return {
        select: () => ({
          eq: (col, v) => {
            q.uid = v;
            return {
              maybeSingle: async () => {
                F.calls.push('select');
                const d = F.rows[q.uid];
                return { data: d === undefined ? null : { data: JSON.parse(JSON.stringify(d)) }, error: null };
              },
            };
          },
        }),
        upsert: async row => {
          F.calls.push('upsert');
          F.rows[row.user_id] = JSON.parse(JSON.stringify(row.data));
          return { error: null };
        },
      };
    },
    rpc: async name => {
      F.calls.push('rpc:' + name);
      if (ses) delete F.rows[ses.user.id];
      return { error: null };
    },
  };
  window.supabase = { createClient: () => client };
}

export function fauxClaude({ remote }) {
  const F = (window.__fake = {
    doc: remote === undefined ? null : { v: 1, at: remote.at || 0, data: JSON.stringify(remote) },
    calls: [],
  });
  const ref = {
    get: async () => {
      F.calls.push('get');
      return { exists: !!F.doc, data: () => F.doc };
    },
    set: async v => {
      F.calls.push('set');
      F.doc = JSON.parse(JSON.stringify(v));
    },
  };
  window.claude = {
    use: async n => (n === 'db' ? { doc: () => ref } : n === 'user' ? { id: async () => 'joueur-1' } : null),
  };
}
