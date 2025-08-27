export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Herd Explorer Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-blue-600 text-white p-3 shadow-lg z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium">
              🌱 Powered by Herd Trails
            </div>
            <div className="text-xs opacity-75 hidden sm:block">
              Transparent crowdfunding on Base network
            </div>
          </div>
          <a
            href="https://herd.eco"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            View on Herd Explorer →
          </a>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 pb-16">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Herd Crowdfund Mini App
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Create and support crowdfunding campaigns directly on Farcaster using Herd Trails.
                All transactions are transparent and secured on Base network.
              </p>
            </div>

            {/* Resources */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>
                  <a href="https://herd.eco" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Herd Trails
                  </a>
                </li>
                <li>
                  <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Base Network
                  </a>
                </li>
                <li>
                  <a href="https://farcaster.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Farcaster
                  </a>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Features</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>🌱 Create Crowdfunds</li>
                <li>💰 Support Projects</li>
                <li>🔄 Claim Refunds</li>
                <li>🔗 Blockchain Transparency</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; {currentYear} Herd Crowdfund Mini App. Built with Herd Trails on Base.</p>
          </div>
        </div>
      </footer>
    </>
  );
}