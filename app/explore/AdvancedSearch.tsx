"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import provinceCityData from "@/data/province_city.json";
import roleData from "@/data/category_role.json";
import { createClient, retryRequest } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import instrumentGroups from '@/data/instruments.js';
import Link from "next/link";
import InfiniteScroll from 'react-infinite-scroll-component';

const GENDERS = [
{ value: "", label: "همه" },
{ value: "male", label: "مرد" },
{ value: "female", label: "زن" },
{ value: "mixed", label: "مختلط" },
];

// Flatten the role data to get a simple array of all roles
const allRoles = roleData.flatMap(category => category.roles);

export default function AdvancedSearch() {
const [province, setProvince] = useState("");
const [city, setCity] = useState("");
const [role, setRole] = useState("");
const [gender, setGender] = useState("");
const [readyForCooperate, setReadyForCooperate] = useState(false);
const [lookingForMusician, setLookingForMusician] = useState(false);
const [selectedInstruments, setSelectedInstruments] = useState([]);
const [selectedInstrumentGroups, setSelectedInstrumentGroups] = useState([]);
const [results, setResults] = useState<any[]>([]);
const [loading, setLoading] = useState(false);
const [page, setPage] = useState(1);
const [hasMore, setHasMore] = useState(true);
const searchParams = useSearchParams();
const [showSearchForm, setShowSearchForm] = useState(true);
const [allInstruments, setAllInstruments] = useState([]);
const containerRef = useRef<HTMLDivElement>(null);
const allCities = provinceCityData.flatMap(p => p.cities.map(c => ({ ...c, province_id: p["province-fa"] })));
const currentCities = allCities.filter(c => c.province_id === province);

const supabase = createClient();

// Load initial search parameters from URL
useEffect(() => {
const urlProvince = searchParams.get('province');
const urlRole = searchParams.get('roles');

if (urlProvince) {
  setProvince(urlProvince);
}
if (urlRole) {
  setRole(urlRole);
}

}, [searchParams]);

useEffect(() => {
const instruments = instrumentGroups.flatMap(group =>
group.instruments.map(instrument => ({ ...instrument, category: group.label }))
);
setAllInstruments(instruments);
}, []);

const fetchProfiles = useCallback(async (page: number, append: boolean = false) => {
if (loading) return;
setLoading(true);

const from = (page - 1) * 20;
const to = from + 19;

try {
  let query = supabase.from('profiles')
    .select(`
      id,
      username,
      display_name,
      profile_image_url,
      is_complete,
      ready_for_cooperate,
      looking_for_musician,
      roles,
      province,
      city,
      profile_instruments(
        instrument_id
      )
    `)
    .eq('is_complete', true)
    .eq('is_admin', false);
  
  if (role) {
    query = query.contains('roles', [role]);
  }
  if (province) {
    query = query.eq('province', province);
  }
  if (city) {
    query = query.eq('city', city);
  }
  if (gender) {
    query = query.eq('gender', gender);
  }
  if (readyForCooperate) {
    query = query.eq('ready_for_cooperate', true);
  }
  if (lookingForMusician) {
    query = query.eq('looking_for_musician', true);
  }
  if (selectedInstruments.length > 0) {
    query = query.in('profile_instruments.instrument_id', selectedInstruments);
  }
  
  const { data, error } = await retryRequest(query.range(from, to));

  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    if (data && data.length > 0) {
      setResults(prevResults => append ? [...prevResults, ...data] : data);
      setHasMore(data.length === 20);
    } else {
      setHasMore(false);
      if (!append) {
        setResults([]);
      }
    }
  }
} finally {
  setLoading(false);
}

}, [supabase, role, province, city, gender, readyForCooperate, lookingForMusician, selectedInstruments, loading]);

useEffect(() => {
setPage(1);
setResults([]);
setHasMore(true);
fetchProfiles(1, false);
}, [role, province, city, gender, readyForCooperate, lookingForMusician, selectedInstruments, fetchProfiles]);

const fetchNextPage = () => {
if (hasMore) {
const nextPage = page + 1;
setPage(nextPage);
fetchProfiles(nextPage, true);
}
};

const handleInstrumentGroupChange = (e) => {
const value = e.target.value;
setSelectedInstrumentGroups(prev =>
prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
);
};

const handleInstrumentChange = (e) => {
const value = e.target.value;
setSelectedInstruments(prev =>
prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
);
};

return (
<div className="bg-gray-900 text-white min-h-screen">
<div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
{/* Toggleable Search Form */}
<div className="mb-8">
<button
onClick={() => setShowSearchForm(!showSearchForm)}
className="flex items-center text-orange-500 hover:text-orange-400 font-bold"
>
{showSearchForm ? 'بستن فرم جستجوی پیشرفته' : 'باز کردن فرم جستجوی پیشرفته'}
<svg
className={w-5 h-5 ml-2 transform transition-transform ${showSearchForm ? 'rotate-180' : ''}}
fill="currentColor"
viewBox="0 0 20 20"
>
<path
fillRule="evenodd"
d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
clipRule="evenodd"
/>
</svg>
</button>
</div>

    {/* Search Filters */}
    {showSearchForm && (
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl mb-12 animate-fade-in-down">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Role Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">نقش‌ها</option>
            {allRoles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>

          {/* Province Dropdown */}
          <select
            value={province}
            onChange={(e) => {
              setProvince(e.target.value);
              setCity('');
            }}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">استان‌ها</option>
            {provinceCityData.map(p => (
              <option key={p["province-fa"]} value={p["province-fa"]}>{p["province-fa"]}</option>
            ))}
          </select>

          {/* City Dropdown */}
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            disabled={!province}
          >
            <option value="">شهرها</option>
            {currentCities.map(c => (
              <option key={c["city-fa"]} value={c["city-fa"]}>{c["city-fa"]}</option>
            ))}
          </select>

          {/* Gender Dropdown */}
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {GENDERS.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          
          {/* Instrument Groups */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium mb-2">گروه سازها:</p>
            <div className="flex flex-wrap gap-2">
              {instrumentGroups.map(group => (
                <label key={group.key} className="flex items-center text-sm font-medium">
                  <input
                    type="checkbox"
                    value={group.key}
                    checked={selectedInstrumentGroups.includes(group.key)}
                    onChange={handleInstrumentGroupChange}
                    className="form-checkbox text-orange-500 h-4 w-4 rounded-md"
                  />
                  <span className="ml-2">{group.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Instruments */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3">
            <p className="text-sm font-medium mb-2">سازها:</p>
            <div className="flex flex-wrap gap-2">
              {instrumentGroups.flatMap(group =>
                selectedInstrumentGroups.includes(group.key) ? group.instruments : []
              ).map(instrument => (
                <label key={instrument.id} className="flex items-center text-sm font-medium">
                  <input
                    type="checkbox"
                    value={instrument.id}
                    checked={selectedInstruments.includes(instrument.id)}
                    onChange={handleInstrumentChange}
                    className="form-checkbox text-orange-500 h-4 w-4 rounded-md"
                  />
                  <span className="ml-2">{instrument.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Checkboxes */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-wrap gap-4">
            <label className="flex items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={readyForCooperate}
                onChange={(e) => setReadyForCooperate(e.target.checked)}
                className="form-checkbox text-orange-500 h-5 w-5 rounded-md"
              />
              <span className="ml-2">آماده همکاری</span>
            </label>
            <label className="flex items-center text-sm font-medium">
              <input
                type="checkbox"
                checked={lookingForMusician}
                onChange={(e) => setLookingForMusician(e.target.checked)}
                className="form-checkbox text-orange-500 h-5 w-5 rounded-md"
              />
              <span className="ml-2">پذیرای همکاری</span>
            </label>
          </div>
        </div>
      </div>
    )}

    {/* Search Results */}
    <InfiniteScroll
      dataLength={results.length}
      next={fetchNextPage}
      hasMore={hasMore}
      loader={<h4 className="text-center text-gray-400 my-8">...در حال بارگذاری</h4>}
      endMessage={<p className="text-center text-gray-400 my-8">به آخر لیست رسیدید!</p>}
      scrollableTarget="scrollableDiv"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {results.map((profile: any) => (
          <Link href={`/profile/${profile.display_name}`} key={profile.id} className="relative block bg-gray-800 rounded-lg shadow-xl p-4 transition-transform transform hover:scale-105">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                  {profile.profile_image_url ? (
                    <img src={profile.profile_image_url} alt={profile.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{profile.display_name}</h3>
                <div className="text-sm text-gray-400 truncate">
                  {profile.roles && profile.roles.length > 0
                      ? profile.roles.map((r: any, idx: number) => {
                          let label = allRoles.find(role => role.value === r)?.label || r;
                          if (r === 'musician' && Array.isArray((profile as any).profile_instruments) && (profile as any).profile_instruments.length > 0) {
                            const firstInst = (profile as any).profile_instruments.find((pi: any) => pi.type === r) || (profile as any).profile_instruments[0];
                            if (firstInst?.instrument_id) {
                              const instName = allInstruments.find(i => i.id === firstInst.instrument_id)?.name || firstInst.instrument_id;
                              label = `${label}${instName ? ` (${instName})` : ''}`;
                            }
                          }
                          return <span key={r}>{label}{idx < profile.roles.length - 1 ? ' / ' : ''}</span>;
                        })
                      : null
                  }
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  {profile.ready_for_cooperate && (
                    <div className="text-sm text-amber-500 font-medium line-clamp-1">آماده همکاری هستم</div>
                  )}
                  {profile.looking_for_musician && (
                    <div className="text-sm text-amber-200 font-medium line-clamp-1">پذیرای همکاری هستیم</div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </InfiniteScroll>
  </div>
</div>

);
}