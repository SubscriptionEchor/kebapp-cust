import React from 'react';
import { Navigation, Clock, MapPin, Info, Store, PersonStanding as Person, ChevronDown, PenLine, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import HoldingTimeInfoSheet from '../components/HoldingTimeInfoSheet';

const Checkout: React.FC = () => {
  const { t } = useTranslation();
  const [showHoldingTimeInfo, setShowHoldingTimeInfo] = React.useState(false);
  const [notes, setNotes] = React.useState<Record<string, string>>({});
  const [confirmedNotes, setConfirmedNotes] = React.useState<Record<string, string>>({});
  const [showNoteInput, setShowNoteInput] = React.useState<Record<string, boolean>>({});
  
  const restaurant = {
    name: "Gasthaus Kater Alex",
    address: "Downtown Berlin, Germany, 10785",
    distance: "1.7",
    holdingTime: 30,
    location: {
      lat: 52.516267,
      lng: 13.322455
    },
    savedAmount: 6.45
  };

  const cartItems = [
    {
      id: '1',
      name: 'Special Chicken Kebab',
      description: 'Chicken, Extra Cheese, Olives',
      price: 20,
      originalPrice: 25.25,
      quantity: 1,
      isVeg: false,
      customizations: ['Extra Cheese', 'Spicy Sauce']
    },
    {
      id: '2',
      name: 'Falafel Kebab',
      description: 'Chickpeas, Fresh Veggies, Tahini',
      price: 15,
      originalPrice: 18.25,
      quantity: 1,
      isVeg: true,
      customizations: ['Extra Falafel', 'Hummus']
    }
  ];

  const handleNoteChange = (itemId: string, note: string) => {
    setNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
  };

  const handleNoteDone = (itemId: string) => {
    if (notes[itemId]?.trim()) {
      setConfirmedNotes(prev => ({
        ...prev,
        [itemId]: notes[itemId]
      }));
    }
    setShowNoteInput(prev => ({
      ...prev,
      [itemId]: false
    }));
  };

  const toggleNoteInput = (itemId: string) => {
    setShowNoteInput(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleQuantityChange = (itemId: string, increment: boolean) => {
    // Implement quantity change logic
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Location Section */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          {/* Time and Location */}
          <div className="mb-2">
            <div className="flex items-center  gap-2">
              <Clock size={20} className="text-gray-600" />
              <h2 className="text-md font-medium text-gray-900">{t('orderStatus.timeAndLocation')}</h2>
            </div>
          </div>

          {/* Holding Time */}
          <div className="mb-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-gray-900">
                {t('orderStatus.holdingTime')}: <span className="text-gray-900 font-medium">4 {t('orderStatus.hr')}</span>
              </p>
              <button 
                onClick={() => setShowHoldingTimeInfo(true)}
                className="text-sm text-[#00B37A] font-medium flex items-center gap-1"
              >
                <Info size={14} />
                <span>{t('orderStatus.whatsThis')}</span>
              </button>
            </div>
          </div>

          {/* Map Placeholder */}
          <div className="h-[150px] bg-[#F3F4F6] rounded-lg mb-4" />

          {/* Restaurant Details */}
          <div className="ps-10 pb-5 border-b">
          <div className="flex items-center gap-3 mb-3 mt-8">
            {/* <div className="w-10 h-10 bg-[#F3F4F6] rounded-lg flex items-center justify-center flex-shrink-0"> */}
              <Store size={25} className="text-gray-600 " />
            {/* </div> */}
            <div className="flex-1">
              <h3 className="text-md font-medium text-gray-900">{restaurant.name}</h3>
              <p className="text-xs text-gray-500">{restaurant.address}</p>
            </div>
          </div>
          <button 
            className="mx-auto ms-10 px-4 inline-flex items-center justify-center gap-2 py-2 border border-[#CCAD11] text-[#CCAD11] rounded-lg text-[13px] font-medium mt-2"
          >
            <Navigation size={16} />
            {t('orderStatus.getDirections')}
          </button>
</div>
          {/* Distance */}
          <div className="flex items-center gap-3 mb-3 ms-10 mt-4">
            {/* <div className="w-7 h-7 bg-[#F3F4F6] rounded-lg flex items-center justify-center flex-shrink-0"> */}
              <Person size={25} className="text-gray-900" />
            {/* </div> */}
            <div>
              <p className="text-md text-black">{t('orderStatus.distance')}</p>
              <p className="text-xs font-medium text-gray-600">1.7 {t('orderStatus.kilometers')}</p>
            </div>
          </div>

          {/* Saved Amount */}
          
        </div>
        <div className="flex items-center justify-center gap-1.5 text-sm bg-[#E6FFE6] p-2 rounded-lg">
            <div className="flex items-center gap-1">
             😄 <span className="text-[#00B37A]">€</span>
              <span className="text-[#00B37A] font-medium">6.45 {t('orderStatus.saved')} </span>
            </div>
            <span className="text-[#00B37A]">{t('orderStatus.onThisOrder')}</span>
          </div>
      </div>

      {/* Cart Items Section */}
      <div className="bg-white mt-4 p-4">
        <h2 className="text-lg font-semibold mb-4">Your items</h2>
        
        <div className="space-y-6">
          {cartItems.map((item) => (
            <div key={item.id} className="border-b border-gray-100 pb-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 border-2 ${item.isVeg ? 'border-green-500' : 'border-red-500'} rounded-sm p-0.5`}>
                      <div className={`w-full h-full rounded-full ${item.isVeg ? 'bg-green-500' : 'bg-red-500'}`} />
                    </div>
                    <h3 className="text-[15px] font-medium">{item.name}</h3>
                  </div>
                  <div className="text-[13px] text-gray-500">
                    {item.description}
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 line-through">€{item.originalPrice.toFixed(2)}</span>
                    <span className="font-medium">€{item.price}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                    <button 
                      onClick={() => handleQuantityChange(item.id, false)}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                    >
                      -
                    </button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, true)}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Customizations */}
              {confirmedNotes[item.id] && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#E6FFE6] flex items-center justify-center">
                    <PenLine size={12} className="text-[#00B37A]" />
                  </div>
                  <span className="text-[13px] text-[#00B37A]">Added</span>
                </div>
              )}
              
              {/* Note Button/Input */}
              <div className="mt-3">
                {showNoteInput[item.id] ? (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[13px] font-medium">Add Note</h4>
                      <button 
                        onClick={() => handleNoteDone(item.id)}
                        className="text-[13px] text-gray-500"
                      >
                        Done
                      </button>
                    </div>
                    <textarea
                      placeholder="Add special instructions for this item..."
                      value={notes[item.id] || ''}
                      onChange={(e) => handleNoteChange(item.id, e.target.value)}
                      className="w-full h-20 bg-white rounded-lg p-2 text-[13px] outline-none border border-gray-200 focus:border-secondary resize-none"
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => toggleNoteInput(item.id)}
                    className="flex items-center gap-2 text-[13px] text-gray-600 hover:text-gray-900"
                  >
                    <MessageSquare size={16} />
                    Add Note
                  </button>
                )}
                {confirmedNotes[item.id] && !showNoteInput[item.id] && (
                  <div className="mt-2 bg-gray-50 p-3 rounded-lg">
                    <p className="text-[13px] text-gray-600">{confirmedNotes[item.id]}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium">
            <MessageSquare size={16} />
            Cooking requests
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-[13px] font-medium">
            <span className="text-xl">+</span>
            Add more items
          </button>
        </div>
      </div>
      
      <HoldingTimeInfoSheet
        isOpen={showHoldingTimeInfo}
        onClose={() => setShowHoldingTimeInfo(false)}
      />
    </div>
  );
};

export default Checkout;