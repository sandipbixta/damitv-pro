
import React from "react";

const SpecialOffer: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full flex justify-center">
        <div className="bg-orange-700 px-6 py-3 rounded-full shadow-md flex items-center">
          <span className="text-xl md:text-2xl font-semibold text-orange-100 flex items-center gap-2">
            🎁 Special Offer
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpecialOffer;
