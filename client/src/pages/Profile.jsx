import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { updateUserSuccess } from '../redux/authSlice';
import api from '../services/api';
import toast from 'react-hot-toast';
import { User, Phone, Image, ArrowRight } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  phone: z.string().optional().refine(val => !val || /^\+?[0-9\s\-()]{7,15}$/.test(val), {
    message: 'Invalid phone format (+1234567890)',
  }),
});

const avatarSchema = z.object({
  avatarUrl: z.string().url('Invalid URL format').trim(),
});

export const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [profileLoading, setProfileLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: registerAvatar,
    handleSubmit: handleAvatarSubmit,
    formState: { errors: avatarErrors },
    reset: resetAvatar,
  } = useForm({
    resolver: zodResolver(avatarSchema),
    defaultValues: {
      avatarUrl: user?.avatar || '',
    },
  });

  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const response = await api.patch('/api/profile', data);
      const updatedUser = response.data.data.user;

      dispatch(updateUserSuccess(updatedUser));
      toast.success('Profile details updated successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update profile details.';
      toast.error(msg);
    } finally {
      setProfileLoading(false);
    }
  };

  const onAvatarSubmit = async (data) => {
    setAvatarLoading(true);
    try {
      const response = await api.patch('/api/profile/avatar', {
        avatarUrl: data.avatarUrl,
      });
      const updatedUser = response.data.data.user;

      dispatch(updateUserSuccess(updatedUser));
      toast.success('Avatar URL updated successfully!');
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update avatar URL.';
      toast.error(msg);
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-display font-extrabold text-slate-900 tracking-tight">Profile Customization</h1>
        <p className="text-sm text-slate-500 mt-1">Configure your identity credentials and communication methods.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Avatar Display */}
        <div className="premium-card rounded-3xl p-6 flex flex-col items-center justify-center text-center">
          <div className="relative">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg shadow-slate-200/50 flex items-center justify-center">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-slate-400" />
              )}
            </div>
          </div>
          <h3 className="font-display font-semibold text-lg text-slate-800 mt-4">
            {user?.firstName} {user?.lastName}
          </h3>
          <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mt-1">
            {user?.role}
          </span>
          <p className="text-xs text-slate-400 mt-3">{user?.email}</p>
        </div>

        {/* Right Side: Update details */}
        <div className="lg:col-span-2 space-y-8">
          {/* General profile Details */}
          <div className="premium-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-display font-bold text-slate-850 flex items-center space-x-2">
              <User className="w-5 h-5 text-blue-600" />
              <span>General Profile Info</span>
            </h2>

            <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="mt-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    {...registerProfile('firstName')}
                    className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      profileErrors.firstName ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  {profileErrors.firstName && <p className="mt-1 text-xs text-red-500">{profileErrors.firstName.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    {...registerProfile('lastName')}
                    className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      profileErrors.lastName ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  {profileErrors.lastName && <p className="mt-1 text-xs text-red-500">{profileErrors.lastName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Phone</label>
                <div className="relative mt-1.5">
                  <input
                    type="text"
                    placeholder="+1234567890"
                    {...registerProfile('phone')}
                    className={`block w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                      profileErrors.phone ? 'border-red-300' : 'border-slate-200'
                    }`}
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
                {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="px-5 py-3 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-400"
                >
                  {profileLoading ? 'Updating...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Avatar Details */}
          <div className="premium-card rounded-3xl p-6 sm:p-8">
            <h2 className="text-xl font-display font-bold text-slate-850 flex items-center space-x-2">
              <Image className="w-5 h-5 text-indigo-600" />
              <span>Customize Profile Avatar</span>
            </h2>

            <form onSubmit={handleAvatarSubmit(onAvatarSubmit)} className="mt-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Avatar Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/avatar.png"
                  {...registerAvatar('avatarUrl')}
                  className={`mt-1.5 block w-full px-4 py-3 rounded-xl bg-slate-50 border text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all ${
                    avatarErrors.avatarUrl ? 'border-red-300' : 'border-slate-200'
                  }`}
                />
                {avatarErrors.avatarUrl && <p className="mt-1 text-xs text-red-500">{avatarErrors.avatarUrl.message}</p>}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={avatarLoading}
                  className="px-5 py-3 text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-750 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:bg-blue-400"
                >
                  {avatarLoading ? 'Updating avatar...' : 'Update Avatar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
