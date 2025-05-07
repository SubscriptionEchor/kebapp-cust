import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Plus, MoreVertical } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast'; 
import { useEffect, useRef } from 'react';

const SavedAddresses: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { profile } = useUser();
  const [addresses, setAddresses] = useState(profile?.addresses || []);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: ''
  });
  
  useEffect(() => {
    if (profile?.addresses) {
      setAddresses(profile.addresses);
    }
  }, [profile]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsModal(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: number) => {
    setAddresses(addresses.map(addr => {
      return {
        ...addr,
        selected: addr._id === id
      };
    }));
    setShowOptionsModal(null);
    toast.success('Address selected');
  };

  const handleEdit = (address: any) => {
    setEditingAddress(address);
    setShowEditModal(true);
    setShowOptionsModal(null);
  };

  const handleDelete = (id: number) => {
    setAddresses(addresses.filter(addr => addr._id !== id));
    setShowDeleteModal(false);
    setShowOptionsModal(null);
    toast.success('Address deleted');
  };

  const handleSaveEdit = () => {
    if (editingAddress) {
      setAddresses(addresses.map(addr =>
        addr._id === editingAddress._id ? editingAddress : addr
      ));
      setShowEditModal(false);
      setEditingAddress(null);
      toast.success('Address updated');
    }
  };

  const handleAddNew = () => {
    if (newAddress.label && newAddress.address) {
      setAddresses([...addresses, {
        id: addresses.length + 1,
        ...newAddress,
        isSelected: false
      }]);
      setShowAddModal(false);
      setNewAddress({ label: '', address: '' });
      toast.success('Address added');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
         
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1 text-[#00B37A]"
        >
          <Plus size={20} />
          <span className="text-sm font-medium">New Address</span>
        </button>
      </div>

      {/* Address List */}
      <div className="p-4 space-y-3">
        {addresses.map((address) => (
          <div 
            key={address._id}
            className="bg-white rounded-xl p-4 relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                  <MapPin size={20} className="text-gray-600" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    {address.label}
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1">
                    {address.deliveryAddress}
                  </p>
                  {address.selected && (
                    <span className="inline-block mt-2 text-xs text-[#00B37A] font-medium">
                      SELECTED
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowOptionsModal(address.id)}
                className="p-2"
              >
                <MoreVertical size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Options Modal */}
            {showOptionsModal === address._id && (
              <div ref={optionsRef} className="absolute right-4 top-12 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(address._id);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50"
                >
                  Select
                </button>
                <button
                  onClick={() => handleEdit(address)}
                  className="w-full px-4 py-2.5 text-left text-[13px] hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(true);
                    setEditingAddress(address);
                  }}
                  className="w-full px-4 py-2.5 text-left text-[13px] text-red-500 hover:bg-gray-50"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
        
        {(!addresses || addresses.length === 0) && (
          <div className="text-center item-center flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin size={24} className="text-gray-400" />
            </div>
             <button
          onClick={() => setShowAddModal(true)}
          className="flex text-white p-2 rounded-lg mb-3 w-fit items-center gap-1 bg-[#00B37A]"
        >
          <Plus size={20} />
          <span className="text-sm font-medium">New Address</span>
        </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved addresses</h3>
            <p className="text-sm text-gray-500">Add your first address to get started</p>
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">Add New Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={newAddress.label}
                  onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                  placeholder="e.g. Home, Work, etc."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <textarea
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  placeholder="Enter full address"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary h-24 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddNew}
                  className="flex-1 py-2.5 bg-secondary text-black rounded-lg font-medium"
                >
                  Add Address
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Address Modal */}
      {showEditModal && editingAddress && (
        <div className="fixed inset-0 bg-black/50 z-50">
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4">
            <h2 className="text-lg font-semibold mb-4">Edit Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Label</label>
                <input
                  type="text"
                  value={editingAddress.label}
                  onChange={(e) => setEditingAddress({ ...editingAddress, label: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Address</label>
                <textarea
                  value={editingAddress.address}
                  onChange={(e) => setEditingAddress({ ...editingAddress, address: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-secondary h-24 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingAddress(null);
                  }}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 py-2.5 bg-secondary text-black rounded-lg font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && editingAddress && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 mx-4 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Address</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this address? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setEditingAddress(null);
                }}
                className="flex-1 py-2.5 border border-gray-200 rounded-lg text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(editingAddress.id)}
                className="flex-1 py-2.5 bg-secondary text-white rounded-lg font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedAddresses;