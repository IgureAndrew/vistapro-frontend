// src/components/SubmissionUnderReview.jsx
import React from "react";

const SubmissionUnderReview = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded shadow p-8 max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Submission Under Review</h2>
        <p className="mb-6">
          Your submission is complete and currently under review. You will receive a notification once your account is verified and your dashboard is unlocked.
        </p>
        <p className="text-sm text-gray-500">
          Please wait while our team processes your verification.
        </p>
      </div>
    </div>
  );
};

export default SubmissionUnderReview;
