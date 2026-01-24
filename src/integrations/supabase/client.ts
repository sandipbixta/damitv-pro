// Mock Supabase client - frontend only, no backend calls
// All functions return empty/success responses

// Mock query builder that returns empty data
const createMockQueryBuilder = () => {
  const builder: any = {
    select: () => builder,
    insert: () => builder,
    update: () => builder,
    delete: () => builder,
    upsert: () => builder,
    eq: () => builder,
    neq: () => builder,
    gt: () => builder,
    gte: () => builder,
    lt: () => builder,
    lte: () => builder,
    like: () => builder,
    ilike: () => builder,
    is: () => builder,
    in: () => builder,
    contains: () => builder,
    containedBy: () => builder,
    range: () => builder,
    textSearch: () => builder,
    filter: () => builder,
    not: () => builder,
    or: () => builder,
    and: () => builder,
    order: () => builder,
    limit: () => builder,
    offset: () => builder,
    single: () => builder,
    maybeSingle: () => builder,
    csv: () => builder,
    then: (resolve: any) => resolve({ data: null, error: null }),
  };
  return builder;
};

// Mock channel for realtime subscriptions
const createMockChannel = () => {
  const channel: any = {
    on: () => channel,
    subscribe: () => channel,
    unsubscribe: () => Promise.resolve(),
  };
  return channel;
};

// Mock Supabase client
export const supabase = {
  // Database operations - return empty data
  from: (table: string) => createMockQueryBuilder(),

  // RPC calls - return success with null data
  rpc: (fn: string, params?: any) => Promise.resolve({ data: null, error: null }),

  // Realtime subscriptions - no-op
  channel: (name: string) => createMockChannel(),
  removeChannel: (channel: any) => Promise.resolve(),
  removeAllChannels: () => Promise.resolve(),

  // Auth - return null user
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signIn: () => Promise.resolve({ data: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },

  // Storage - return empty
  storage: {
    from: (bucket: string) => ({
      upload: () => Promise.resolve({ data: null, error: null }),
      download: () => Promise.resolve({ data: null, error: null }),
      getPublicUrl: (path: string) => ({ data: { publicUrl: '' } }),
      list: () => Promise.resolve({ data: [], error: null }),
      remove: () => Promise.resolve({ data: null, error: null }),
    }),
  },

  // Functions - return empty
  functions: {
    invoke: (fn: string, options?: any) => Promise.resolve({ data: null, error: null }),
  },
};

console.log('🚀 Running in frontend-only mode - Supabase disabled');
