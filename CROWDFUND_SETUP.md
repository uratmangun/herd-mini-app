# Herd Crowdfund Mini App Setup Guide

This Farcaster Mini App integrates with Herd Trails to provide crowdfunding functionality directly within Farcaster. Users can create campaigns, donate to projects, and claim refunds all through blockchain transactions on Base network.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm package manager
- Alchemy API key for Base network RPC
- WalletConnect Project ID (optional but recommended)

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Configure the required variables in `.env.local`:

```env
# App configuration
NEXT_PUBLIC_APP_URL=https://your-domain.pages.dev
NEXT_PUBLIC_APP_DOMAIN=your-domain.pages.dev

# Wallet connection (required)
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_api_key_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id_here

# Herd Trails API (pre-configured)
NEXT_PUBLIC_HERD_TRAIL_APP_ID=0198e901-43fa-7800-97c5-a331b77852dd

# Farcaster configuration (for mini app metadata)
NEXT_PUBLIC_FARCASTER_DEVELOPER_FID=your_fid_here
```

### Installation & Development

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🔧 Configuration

### Getting API Keys

#### Alchemy API Key
1. Visit [Alchemy](https://www.alchemy.com/)
2. Create an account and new project
3. Select "Base Mainnet" as the network
4. Copy the API key to `NEXT_PUBLIC_ALCHEMY_ID`

#### WalletConnect Project ID
1. Visit [WalletConnect](https://cloud.reown.com/)
2. Create a new project
3. Copy the Project ID to `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### Farcaster Mini App Configuration

Update the `public/.well-known/farcaster.json` file with your app details:

```json
{
  "miniapp": {
    "name": "Your Crowdfund App Name",
    "buttonTitle": "Launch Crowdfund",
    "homeUrl": "https://your-domain.pages.dev",
    "imageUrl": "https://your-domain.pages.dev/images/your-image.png",
    "splashImageUrl": "https://your-domain.pages.dev/images/your-splash.png",
    "splashBackgroundColor": "#0ea5e9"
  }
}
```

## 🌱 Features Overview

### Create Crowdfunds
- Connect wallet using ConnectKit
- Fill out campaign details (title, description, goal, duration)
- Deploy crowdfund contract to Base network via Herd Trails
- Share campaign on Farcaster

### Support Projects
- Browse active crowdfunding campaigns
- View campaign progress and details
- Donate ETH to support projects
- Leave optional messages for creators

### Claim Refunds
- View donation history
- Identify eligible refunds from unsuccessful campaigns
- Process refund transactions through smart contracts
- Track refund status on blockchain

## 🔗 Integration Details

### Herd Trails API
The app uses Herd Trails API for:
- **Trail Evaluation**: Get transaction calldata for each step
- **Execution Tracking**: Record transaction hashes and outcomes
- **History Management**: Query past interactions and campaign data
- **Rate Limiting**: Enforces 5-second intervals between API calls

### Base Network
All transactions occur on Base:
- **Crowdfund Creation**: Deploy campaign contracts
- **Donations**: Send ETH to campaign addresses
- **Refunds**: Process returns through smart contracts
- **Transparency**: All transactions publicly verifiable

### Farcaster Integration
- **Mini App SDK**: Authentication and context
- **Compose Cast**: Share campaigns directly to Farcaster
- **Profile Integration**: View user profiles and FIDs
- **Seamless UX**: Native feel within Farcaster client

## 🏗️ Architecture

### Components Structure
```
src/
├── components/
│   ├── sections/
│   │   ├── CrowdfundCreation.tsx    # Create new campaigns
│   │   ├── CrowdfundDonation.tsx    # Support existing projects
│   │   └── CrowdfundRefund.tsx      # Claim refunds
│   ├── providers/
│   │   ├── Web3Provider.tsx         # Wagmi + ConnectKit setup
│   │   └── index.tsx                # Combined providers
│   └── layout/
│       └── footer.tsx               # Herd Explorer sticky footer
├── hooks/
│   └── useHerdTransaction.ts        # Transaction management
├── lib/
│   └── herd-api.ts                  # API utilities
└── app/
    └── page.tsx                     # Main tabbed interface
```

### State Management
- **Wallet State**: Managed by Wagmi hooks (`useAccount`, `useSendTransaction`)
- **Transaction State**: Custom hook (`useHerdTransaction`) handles evaluation and execution
- **Farcaster Context**: SDK provides user info and mini app status
- **UI State**: Local component state for forms and navigation

## 🚀 Deployment

### Cloudflare Pages
```bash
# Build for production
pnpm build

# Deploy using Wrangler
pnpm deploy
```

### Vercel
```bash
# Build and deploy
vercel --prod
```

### Environment Variables for Production
Ensure all environment variables are set in your deployment platform:
- `NEXT_PUBLIC_ALCHEMY_ID`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` 
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_APP_DOMAIN`

## 🐛 Troubleshooting

### Common Issues

**Wallet Connection Fails**
- Verify `NEXT_PUBLIC_ALCHEMY_ID` is set correctly
- Check that Base network is supported by user's wallet
- Ensure WalletConnect Project ID is valid

**Transaction Errors**
- Confirm user has sufficient ETH for gas fees
- Verify network is Base (Chain ID: 8453)
- Check Herd API rate limiting (5-second intervals)

**Mini App Not Loading**
- Verify `farcaster.json` configuration is correct
- Check that domain matches deployed URL
- Ensure images are publicly accessible

**API Failures**
- Confirm `NEXT_PUBLIC_HERD_TRAIL_APP_ID` is set
- Check network connectivity
- Verify API endpoints are reachable

### Debug Mode
Enable detailed logging by adding to `.env.local`:
```env
NEXT_PUBLIC_DEBUG=true
```

## 📚 Resources

- [Herd Trails Documentation](https://herd.eco)
- [Farcaster Mini App SDK](https://docs.farcaster.xyz/mini-apps/sdk)
- [ConnectKit Documentation](https://docs.family.co/connectkit)
- [Base Network Documentation](https://docs.base.org)
- [Wagmi Documentation](https://wagmi.sh)

## 🤝 Support

For technical support:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all environment variables are configured
4. Test wallet connection independently

For Herd Trails specific issues, visit [herd.eco](https://herd.eco) for documentation and support resources.
