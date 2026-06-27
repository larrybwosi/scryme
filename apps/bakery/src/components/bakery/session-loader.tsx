const SessionSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-linear-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Main Content Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header Section */}
          <HeaderSkeleton />

          {/* Authentication Card */}
          <AuthCardSkeleton />

          {/* Footer Links */}
          <FooterSkeleton />
        </div>
      </div>

      {/* Loading Indicator */}
      <LoadingIndicator />
    </div>
  );
};

// Header skeleton component
const HeaderSkeleton: React.FC = () => (
  <div className="text-center space-y-4">
    {/* Logo */}
    <div className="mx-auto w-20 h-20 bg-gray-200 rounded-full animate-pulse shadow-sm" />

    {/* Title and subtitle */}
    <div className="space-y-3">
      <div className="h-7 bg-gray-200 rounded-lg animate-pulse mx-auto w-36" />
      <div className="h-4 bg-gray-200 rounded-md animate-pulse mx-auto w-52" />
    </div>
  </div>
);

// Authentication card skeleton component
const AuthCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 space-y-6">
    {/* Form Fields */}
    <div className="space-y-5">
      <FormFieldSkeleton label="Email" />
      <FormFieldSkeleton label="Password" />
    </div>

    {/* Primary Action Button */}
    <div className="pt-2">
      <div className="h-11 bg-gray-200 rounded-lg animate-pulse w-full" />
    </div>

    {/* Divider with "OR" text */}
    <div className="relative py-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center">
        <div className="bg-white px-4">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-8" />
        </div>
      </div>
    </div>

    {/* Social Login Buttons */}
    <div className="space-y-3">
      <SocialButtonSkeleton />
      <SocialButtonSkeleton />
    </div>
  </div>
);

// Form field skeleton component
const FormFieldSkeleton: React.FC<{ label: string }> = ({ label }) => (
  <div className="space-y-2">
    <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
    <div className="h-11 bg-gray-100 rounded-lg animate-pulse w-full border" />
  </div>
);

// Social button skeleton component
const SocialButtonSkeleton: React.FC = () => (
  <div className="h-11 bg-gray-100 rounded-lg animate-pulse w-full border border-gray-200" />
);

// Footer skeleton component
const FooterSkeleton: React.FC = () => (
  <div className="text-center space-y-3">
    <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto w-44" />
    <div className="flex justify-center items-center space-x-6">
      <div className="h-4 bg-gray-200 rounded animate-pulse w-16" />
      <div className="w-1 h-1 bg-gray-300 rounded-full" />
      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
    </div>
  </div>
);

// Loading indicator component
const LoadingIndicator: React.FC = () => (
  <div className="fixed bottom-6 right-6 z-50">
    <div className="flex items-center space-x-3 bg-white rounded-full shadow-lg border border-gray-200 px-4 py-3">
      <div className="relative">
        <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
      <span className="text-sm font-medium text-gray-700">Loading...</span>
    </div>
  </div>
);

export default SessionSkeleton;
