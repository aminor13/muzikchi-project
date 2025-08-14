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

export default function AdvancedSearch() {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [readyForCooperate, setReadyForCooperate] = useState(false);
  const [lookingForMusician, setLookingForMusician] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchParams = useSearchParams();
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [instrument, setInstrument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const isLoadingRef = useRef(false);

  const q = searchParams.get("q")?.trim();

  // شهرهای استان انتخاب شده
  const cities = provinceCityData.find((p: any) => p["province-fa"] === province)?.cities || [];

  // نقش‌ها (flat)
  const allRoles = roleData.flatMap((cat: any) => cat.roles).filter(Boolean);

  // Helper: flat list of all instruments
  const allInstruments = instrumentGroups.flatMap(g =>
    g.instruments ? g.instruments : (g.subgroups ? g.subgroups.flatMap(sg => sg.instruments) : [])
  );

  // Check if any filter is active
  const hasActiveFilters = province || city || role || gender || category || instrument || name || readyForCooperate || lookingForMusician;

  // تعداد پروفایل در هر صفحه
  const PAGE_SIZE = 12;

  // تابع بارگذاری داده‌ها
  const fetchProfiles = async (pageNum = 1, append = false) => {
    if (isLoadingRef.current) {
      console.log('Fetch blocked - already loading');
      return;
    }
    
    console.log('Starting fetchProfiles:', { pageNum, append, filters: { name, province, city, role, category, instrument, gender, readyForCooperate, lookingForMusician } });
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      console.log('Fetch timeout triggered');
      isLoadingRef.current = false;
      setLoading(false);
      setError("درخواست با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
    }, 10000); // Reduced from 30 seconds to 10 seconds
    
    try {
      console.log('Creating Supabase client...');
      const supabase = createClient();
      
      // Use retry logic for all database operations
      const executeQuery = async () => {
        // First, test basic connection with a simple query
        console.log('Testing basic connection...');
        const { data: testData, error: testError } = await supabase
          .from("profiles")
          .select("id")
          .limit(1);
        
        console.log('Basic connection test result:', { testData, testError });
        
        if (testError) {
          console.error('Basic connection failed:', testError);
          throw new Error('خطا در اتصال به دیتابیس');
        }
        
        console.log('Building query...');
        let query = supabase
          .from("profiles")
          .select("id, name, display_name, avatar_url, province, city, category, roles, ready_for_cooperate, looking_for_musician")
          .eq('is_complete', true)
          .limit(PAGE_SIZE); // Use limit instead of range for better performance
        
        // Test count query first
        console.log('Testing count query...');
        const { count: totalCount, error: countError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq('is_complete', true);
        
        console.log('Count query result:', { totalCount, countError });
        
        if (countError) {
          console.error('Count query failed:', countError);
          throw new Error('خطا در دریافت تعداد پروفایل‌ها');
        }
        
        console.log('Total profiles count:', totalCount);
        
        // Apply basic filters only
        if (name) {
          console.log('Applying name filter:', name);
          query = query.or(`name.ilike.%${name}%,display_name.ilike.%${name}%`);
        }
        if (province) {
          console.log('Applying province filter:', province);
          query = query.eq("province", province);
        }
        if (city) {
          console.log('Applying city filter:', city);
          query = query.eq("city", city);
        }
        if (role) {
          console.log('Applying role filter:', role);
          query = query.contains("roles", [role]);
        }
        if (category === 'band') {
          console.log('Applying band filter');
          query = query.eq("category", 'band');
        }
        if (gender) {
          console.log('Applying gender filter:', gender);
          query = query.eq("gender", gender);
        }
        if (readyForCooperate) {
          console.log('Applying ready for cooperate filter');
          query = query.eq("ready_for_cooperate", true);
        }
        if (lookingForMusician) {
          console.log('Applying looking for musician filter');
          query = query.eq("looking_for_musician", true);
        }
        
        // Skip instrument filter for now to simplify
        if (instrument) {
          console.log('Skipping instrument filter for now to simplify query');
        }
        
        console.log('Final query before execution:', query);
        console.log('Executing query...');
        const { data, error: supabaseError, count } = await query;
        
        console.log('Query result:', { dataLength: data?.length, error: supabaseError, count });
        
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error('خطا در دریافت اطلاعات');
        }
        
        return { data, count };
      };
      
      // Use retry logic
      const { data, count } = await retryRequest(executeQuery, 3, 1000);
      
      // Clear timeout on success
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (append) {
        setResults(prev => [...prev, ...(data || [])]);
      } else {
        setResults(data || []);
      }
      setHasMore((data?.length || 0) === PAGE_SIZE);
      setRetryCount(0);
      console.log('Fetch successful:', { resultsCount: data?.length, hasMore: (data?.length || 0) === PAGE_SIZE });
      
    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      console.error('Fetch error:', err);
      setResults([]);
      setHasMore(false);
      setError(err instanceof Error ? err.message : "خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
      console.log('Fetch completed, loading set to false');
    }
  };

  // Retry function
  const retryFetch = () => {
    if (retryCount >= 3) {
      setError("تعداد تلاش‌های مجدد به حداکثر رسیده. لطفاً صفحه را رفرش کنید.");
      return;
    }
    setRetryCount(prev => prev + 1);
    setPage(1);
    fetchProfiles(1, false);
  };

  // Clear cache and reset function
  const clearCacheAndReset = () => {
    console.log('Clearing cache and resetting...');
    setResults([]);
    setError(null);
    setRetryCount(0);
    setPage(1);
    setHasMore(true);
    isLoadingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Reset Supabase client
    const { resetClient } = require('@/utils/supabase/client');
    resetClient();
  };

  // تابع بارگذاری صفحه بعد
  const fetchNext = () => {
    if (!isLoadingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfiles(nextPage, true);
    }
  };

  // Single useEffect for all initialization and data fetching
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const initializeAndFetch = async () => {
      try {
        console.log('Starting initialization...');
        
        // Check session first
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          // Don't throw error for session issues, just log them
        } else {
          console.log('Session status:', session ? 'Active' : 'No session');
        }
        
        // Initialize from URL parameters
        const provinceParam = searchParams.get("province");
        const cityParam = searchParams.get("city");
        const roleParam = searchParams.get("role");
        const genderParam = searchParams.get("gender");
        const categoryParam = searchParams.get("category");
        const nameParam = searchParams.get("name");
        const readyParam = searchParams.get("ready");
        const lookingParam = searchParams.get("looking");
        const instrumentParam = searchParams.get("instrument");
        const showSearchFormParam = searchParams.get("showSearchForm");

        console.log('URL parameters loaded:', { provinceParam, cityParam, roleParam, genderParam, categoryParam, nameParam });

        // Set all states at once
        setProvince(provinceParam || "");
        setCity(cityParam || "");
        setRole(roleParam || "");
        setGender(genderParam || "");
        setCategory(categoryParam || "");
        setName(nameParam || "");
        setReadyForCooperate(readyParam === 'true');
        setLookingForMusician(lookingParam === 'true');
        setInstrument(instrumentParam || "");

        if (showSearchFormParam === 'true') {
          setShowSearchForm(true);
        }

        console.log('States set, marking as initialized...');
        setIsInitialized(true);
        
        // Fetch initial data
        console.log('Starting initial data fetch...');
        setPage(1);
        await fetchProfiles(1, false);
        console.log('Initial data fetch completed');
      } catch (error) {
        console.error('Initialization error:', error);
        setError("خطا در مقداردهی اولیه. لطفاً صفحه را رفرش کنید.");
      }
    };

    initializeAndFetch();
  }, [searchParams]); // Removed fetchProfiles from dependencies

  // Handle filter changes after initialization
  useEffect(() => {
    if (isInitialized && !isInitializingRef.current) {
      setPage(1);
      fetchProfiles(1, false);
    }
  }, [isInitialized, province, city, role, gender, category, name, readyForCooperate, lookingForMusician, instrument]); // Removed fetchProfiles from dependencies

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Monitor authentication status
  useEffect(() => {
    const supabase = createClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      console.log('Auth state changed in component:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        // Clear cache when auth state changes
        clearCacheAndReset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">اعضاء</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSearchForm(!showSearchForm)}
            className="flex items-center gap-2 bg-white text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            {showSearchForm ? 'بستن فیلترها' : 'جستجوی پیشرفته'}
          </button>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 flex flex-wrap gap-2">
          {name && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {name}
              <button onClick={() => setName("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          {province && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {province}
              <button onClick={() => { setProvince(""); setCity(""); }} className="hover:text-orange-200">×</button>
            </span>
          )}
          {city && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {city}
              <button onClick={() => setCity("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          {role && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {allRoles.find(r => r.value === role)?.label}
              <button onClick={() => setRole("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          {category === 'band' && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              گروه موسیقی
              <button onClick={() => setCategory("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          {gender && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {GENDERS.find(g => g.value === gender)?.label}
              <button onClick={() => setGender("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          {readyForCooperate && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              آماده همکاری
              <button onClick={() => setReadyForCooperate(false)} className="hover:text-orange-200">×</button>
            </span>
          )}
          {lookingForMusician && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              پذیرای همکاری
              <button onClick={() => setLookingForMusician(false)} className="hover:text-orange-200">×</button>
            </span>
          )}
          {instrument && (
            <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
              {allInstruments.find(i => i.id === instrument)?.name || instrument}
              <button onClick={() => setInstrument("")} className="hover:text-orange-200">×</button>
            </span>
          )}
          <button
            onClick={() => {
              setName("");
              setProvince("");
              setCity("");
              setRole("");
              setGender("");
              setCategory("");
              setReadyForCooperate(false);
              setLookingForMusician(false);
              setInstrument("");
              fetchProfiles(1, false);
            }}
            className="bg-gray-700 text-gray-300 hover:bg-gray-600 px-3 py-1 rounded-full text-sm"
          >
            پاک کردن همه
          </button>
        </div>
      )}

      {/* Search Form */}
      {showSearchForm && (
        <div className="bg-gray-800 rounded-xl shadow-md p-8 mb-10">
          {/* Main Search Form */}
          <div className="space-y-8">
            {/* Quick Search Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">جستجوی سریع</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Name Search */}
                <div>
                  <input
                    type="text"
                    placeholder="نام یا نام کاربری"
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100 placeholder-gray-400"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                {/* Location Search */}
                <div className="flex gap-4">
                  <select
                    className="w-1/2 px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                    value={province}
                    onChange={e => {
                      setProvince(e.target.value);
                      setCity("");
                    }}
                  >
                    <option value="">همه استان‌ها</option>
                    {provinceCityData.map((p: any) => (
                      <option key={p["province-fa"]} value={p["province-fa"]}>{p["province-fa"]}</option>
                    ))}
                  </select>
                  <select
                    className="w-1/2 px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    disabled={!province}
                  >
                    <option value="">همه شهرها</option>
                    {cities.map((c: any) => (
                      <option key={c["city-fa"]} value={c["city-fa"]}>{c["city-fa"]}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Role & Category Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">نوع فعالیت</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <select
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                    value={role}
                    onChange={e => setRole(e.target.value)}
                  >
                    <option value="">همه عناوین (نوازنده، خواننده، ...)</option>
                    {allRoles.map((r: any) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                  {(role === 'musician' || role === 'teacher') && (
                    <select
                      className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                      value={instrument}
                      onChange={e => setInstrument(e.target.value)}
                    >
                      <option value="">انتخاب ساز</option>
                      {allInstruments.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="space-y-4">
                  {!role && (
                    <label className="flex items-center gap-2 text-gray-100 p-2 border border-gray-700 rounded-lg bg-gray-900">
                      <input
                        type="checkbox"
                        checked={category === 'band'}
                        onChange={e => setCategory(e.target.checked ? 'band' : '')}
                        className="w-4 h-4"
                      />
                      <span>فقط گروه‌های موسیقی</span>
                    </label>
                  )}
                  <select
                    className="w-full px-4 py-3 rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                  >
                    {GENDERS.map(g => (
                      <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white border-b border-gray-700 pb-2">فیلترهای تکمیلی</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-gray-100 p-2 border border-gray-700 rounded-lg bg-gray-900">
                  <input
                    type="checkbox"
                    checked={readyForCooperate}
                    onChange={e => setReadyForCooperate(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>آماده همکاری</span>
                </label>
                <label className="flex items-center gap-2 text-gray-100 p-2 border border-gray-700 rounded-lg bg-gray-900">
                  <input
                    type="checkbox"
                    checked={lookingForMusician}
                    onChange={e => setLookingForMusician(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span>پذیرای همکاری</span>
                </label>
              </div>
            </div>

            {/* Search Button */}
            <div className="pt-4">
              <button
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-lg shadow transition-colors"
                type="button"
                onClick={() => fetchProfiles(1, false)}
              >
                جستجو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Section */}
      <div>
        {!isInitialized ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
            <div className="mt-2 text-lg text-orange-500">در حال بارگذاری...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg mb-4">{error}</div>
            {retryCount >= 3 ? (
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  رفرش صفحه
                </button>
                <button
                  onClick={clearCacheAndReset}
                  className="block mx-auto bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  پاک کردن کش
                </button>
              </div>
            ) : (
              <button
                onClick={retryFetch}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                تلاش مجدد
              </button>
            )}
          </div>
        ) : results.length === 0 && !loading ? (
          <div className="text-center py-12 text-gray-300">نتیجه‌ای یافت نشد.</div>
        ) : (
          <InfiniteScroll
            dataLength={results.length}
            next={fetchNext}
            hasMore={hasMore}
            loader={
              <div className="text-center py-6">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
                <div className="mt-2 text-lg text-orange-500">در حال بارگذاری...</div>
              </div>
            }
            endMessage={
              <p className="text-center py-6 text-gray-400">همه نتایج نمایش داده شد.</p>
            }
            style={{ overflow: 'visible' }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map(profile => (
                <Link
                  key={profile.id}
                  href={`/profile/${profile.display_name}`}
                  className="block h-full"
                >
                  <div className="bg-gray-800 rounded-xl flex flex-col h-full hover:shadow-lg transition border border-gray-700 cursor-pointer hover:border-orange-500">
                    <div className="w-full relative" style={{ paddingBottom: '100%' }}>
                      <img
                        src={profile.avatar_url || '/default-avatar.png'}
                        alt={profile.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
                      />
                    </div>
                    <div className="p-4 w-full flex-1 flex flex-col min-h-[140px]">
                      <div className="font-bold text-lg text-white mb-2 line-clamp-1">{profile.name}</div>
                      <div className="text-sm text-gray-300 mb-2 line-clamp-1">{profile.city}، {profile.province}</div>
                      <div className="text-sm text-gray-400 mb-auto line-clamp-1">
                        {profile.category === 'band' ? (
                          <span>گروه موسیقی</span>
                        ) : (
                          Array.isArray(profile.roles) && profile.roles.length > 0
                            ? profile.roles.map((role: string, idx: number) => {
                                const r = allRoles.find((ar: any) => ar.value === role);
                                return r ? (
                                  <span key={role}>{r.label}{idx < profile.roles.length - 1 ? ' / ' : ''}</span>
                                ) : null;
                              })
                            : null
                        )}
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
        )}
      </div>
    </div>
  );
} 