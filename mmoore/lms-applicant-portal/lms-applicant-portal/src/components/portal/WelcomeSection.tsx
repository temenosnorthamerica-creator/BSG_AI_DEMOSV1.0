interface WelcomeSectionProps {
  firstName: string;
}

export function WelcomeSection({ firstName }: WelcomeSectionProps) {
  // Capitalize first letter
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1);

  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl md:text-3xl font-normal text-gray-800 mb-2">
        Hello {displayName},
      </h1>
      <p className="text-gray-600">
        You can manage your applications, explore personalized offers, and track your progress - all in one place.
      </p>
    </div>
  );
}
