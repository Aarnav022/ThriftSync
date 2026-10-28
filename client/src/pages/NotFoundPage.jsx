import React from 'react';
import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="bg-white p-12 rounded border border-gray-200 text-center max-w-lg mx-auto my-12 space-y-4">
      <div className="text-4xl font-extrabold text-[#131921]">404</div>
      <h2 className="text-xl font-bold text-[#0F1111]">Looking for something?</h2>
      <p className="text-sm text-gray-600">
        We're sorry. The Web address you entered is not a functioning page on our site.
      </p>
      <Link
        to="/"
        className="inline-block px-6 py-2 bg-[#FFD814] hover:bg-[#F7CA00] text-sm font-bold rounded shadow-xs"
      >
        Go to ThriftSyn's Home Page
      </Link>
    </div>
  );
}
