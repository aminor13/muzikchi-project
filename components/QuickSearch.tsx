'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import provinceCityData from '@/data/province_city.json';
import roleData from '@/data/category_role.json';

// Flatten the role data to get a simple array of all roles
const allRoles = roleData.flatMap(category => category.roles);

export default function QuickSearch() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  const handleSearch = () => {
  const params = new URLSearchParams();
    if (selectedRole) {
    params.append('roles', selectedRole);
    }
    if (selectedProvince) {
    params.append('province', selectedProvince);
    }
  router.push(`/explore?${params.toString()}`);
  };

  return (
    <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
      {/* Role Dropdown */}
      <select
      value={selectedRole}
      onChange={(e) => setSelectedRole(e.target.value)}
      className="w-full md:w-64 bg-gray-800 text-white rounded-lg p-3 text-center transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500">

      <option value="">نقش‌ها</option>
      {allRoles.map((role) => (
        <option key={role.value} value={role.value}>
        {role.label}
        </option>
      ))}
      </select>

      {/* Province Dropdown */}
      <select
      value={selectedProvince}
      onChange={(e) => setSelectedProvince(e.target.value)}
      className="w-full md:w-64 bg-gray-800 text-white rounded-lg p-3 text-center transition duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500">
  
      <option value="">استان‌ها</option>
      {provinceCityData.map((province) => (
      <option key={province["province-fa"]} value={province["province-fa"]}>
        {province["province-fa"]}
      </option>
      ))}
      </select>

      {/* Search Button */}
      <button
      onClick={handleSearch}
      className="w-full md:w-auto bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-500">
  
      جستجو
      </button>
    </div>
  );
}
