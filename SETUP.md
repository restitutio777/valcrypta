# ValCrypta - End-to-End Encrypted Messenger Setup

## Database Setup

Before running the application, you need to set up the database tables in Supabase.

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor: `https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql`
3. Copy the entire contents of `supabase/init.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the SQL

### Option 2: Using the Supabase CLI (if installed)

```bash
supabase db push
```

## What the Database Setup Does

The SQL script creates four tables with Row Level Security enabled:

1. **users** - Stores user profiles with public encryption keys
2. **messages** - Stores encrypted messages
3. **contacts** - Manages user contact lists
4. **key_backups** - Optional password-encrypted private-key backups
   (used by the Balanced/Comfort security levels; only the owner can
   read their row, and the blob is encrypted client-side before upload)

> Already ran an older `init.sql`? Apply just the new table by running
> `supabase/migrations/20260704090000_add_key_backups.sql` in the SQL editor.

All tables have proper RLS policies to ensure:
- Users can only view their own messages
- Public keys are accessible to all authenticated users (needed for encryption)
- Users can only modify their own data

## Running the Application

Once the database is set up:

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

## How to Use

1. **Create an Account**
   - Click "Sign Up"
   - Choose a unique username
   - Use a strong password (this encrypts your messages!)
   - **IMPORTANT:** Write down your password - if you lose it, you cannot decrypt your messages

2. **Add Contacts**
   - Use the search bar in the sidebar
   - Search for users by username
   - Click on a user to add them as a contact

3. **Send Encrypted Messages**
   - Select a contact from your list
   - Type your message
   - Click Send
   - Messages are encrypted on your device before being sent

## Security Features

- **End-to-End Encryption:** Each message is encrypted with a fresh AES-GCM 256-bit key, wrapped with RSA-OAEP 2048-bit for recipient and sender
- **Private Key Protection:** Your private key is encrypted with your password using AES-GCM 256-bit
- **Client-Side Only:** Private keys never leave your device
- **Row Level Security:** Database access is restricted at the PostgreSQL level
- **Password-Based Encryption:** Your password is used to encrypt your private key (not stored on server)

## Technical Stack

- React 18 + TypeScript
- Supabase (Auth + Database + Realtime)
- Web Crypto API (built-in browser encryption)
- Zustand (state management)
- TailwindCSS (styling)
- Lucide React (icons)

## Important Security Notes

1. **Your password encrypts your messages** - If you lose it, messages cannot be recovered
2. **The server never sees your private key** - It's stored encrypted in IndexedDB
3. **Messages are encrypted before leaving your browser** - The server only stores encrypted blobs
4. **Public keys are intentionally public** - Others need them to encrypt messages for you
5. **No one can read your messages except you and the recipient** - Not even database administrators

## Troubleshooting

### Database Errors
If you see database errors when signing up or messaging:
- Make sure you ran the SQL from `supabase/init.sql` in your Supabase dashboard
- Check that RLS is enabled on all tables
- Verify your Supabase credentials in `.env`

### Cannot Decrypt Messages
This usually means:
- You're using a different password than when you created your account
- Your private key was deleted from IndexedDB
- The message was corrupted

### Real-time Messages Not Working
- Check that Supabase Realtime is enabled for your project
- Ensure the `messages` table has Realtime enabled

## Development

```bash
# Type check
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

MIT
