import React, { useState } from 'react';
import { X, MapPin, Check, Building, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CAMPUS_ZONES = [
  { name: 'North Campus Hub', spot: 'Central Library Entrance', pincode: '110007' },
  { name: 'South Campus Hostel 4', spot: 'Student Center Desk', pincode: '110021' },
  { name: 'Engineering Quad', spot: 'Computer Science Lab Gate', pincode: '110016' },
  { name: 'Central Administration', spot: 'Security Reception Desk', pincode: '110001' },
];

export function LocationModal({ isOpen, onClose }) {
  const { user, deliveryLocation, updateDeliveryLocation } = useAuth();
  const [selectedZone, setSelectedZone] = useState(deliveryLocation.campus || 'North Campus Hub');
  const [inputPincode, setInputPincode] = useState('');

  if (!isOpen) return null;

  const handleSelectZone = (zone) => {
    setSelectedZone(zone.name);
    updateDeliveryLocation({
      campus: zone.name,
      pickupSpot: zone.spot,
      pincode: zone.pincode,
    });
    onClose();
  };

  const handleApplyAddress = (addr) => {
    updateDeliveryLocation({
      recipientName: addr.name,
      city: addr.city,
      pincode: addr.pincode,
      campus: addr.pickupSpot ? `${addr.city} (${addr.pickupSpot})` : addr.city,
      pickupSpot: addr.pickupSpot || 'Student Center',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#1D3B32] text-white px-5 py-3.5 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#E07A5F]" />
            <span>Choose Handover & Delivery Spot</span>
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-300 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 text-xs text-[#122620] space-y-4">
          <p className="text-gray-600 leading-relaxed">
            Select your campus hostel, faculty building, or designated meetup zone to see verified peer listings ready for instant handover.
          </p>

          {/* Official Campus Pickup Spots */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2A6F4E] block">
              Official Campus Meetup Zones
            </span>
            <div className="space-y-1.5">
              {CAMPUS_ZONES.map((zone) => {
                const isSelected = deliveryLocation.campus === zone.name;
                return (
                  <button
                    key={zone.name}
                    onClick={() => handleSelectZone(zone)}
                    className={`w-full text-left p-2.5 rounded border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#2A6F4E] bg-[#DCFCE7]/40 ring-1 ring-[#2A6F4E] font-bold'
                        : 'border-[#E6E4DD] hover:border-gray-400 bg-white'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#122620]">
                        <Building className="w-3.5 h-3.5 text-[#2A6F4E]" />
                        <span>{zone.name}</span>
                      </div>
                      <p className="text-[11px] text-[#5C635E] pl-5">Spot: {zone.spot}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#2A6F4E] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* User's Saved Addresses */}
          {user?.savedAddresses && user.savedAddresses.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-[#E6E4DD]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C635E] block">
                Your Saved Hostel / Home Addresses
              </span>
              <div className="space-y-1.5">
                {user.savedAddresses.map((addr) => (
                  <button
                    key={addr.id}
                    onClick={() => handleApplyAddress(addr)}
                    className="w-full text-left p-2.5 rounded border border-[#E6E4DD] hover:border-gray-400 bg-white transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-[#122620]">
                        <Home className="w-3.5 h-3.5 text-[#E07A5F]" />
                        <span>{addr.name}</span>
                      </div>
                      <p className="text-[11px] text-[#5C635E] pl-5">{addr.line1}, {addr.city}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
