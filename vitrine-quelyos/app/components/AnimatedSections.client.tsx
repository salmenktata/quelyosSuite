"use client";

const animationStyles = `
  #hero-section > div {
    animation: fadeInUp 0.5s ease-out;
  }

  #finance {
    animation: slideInLeft 0.5s ease-out;
  }

  #marketing {
    animation: slideInRight 0.5s ease-out;
  }

  .animate-section {
    animation: fadeInUp 0.5s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInLeft {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default function AnimatedSections() {
  return <style dangerouslySetInnerHTML={{ __html: animationStyles }} />;
}
