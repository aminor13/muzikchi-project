"use client";

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import provinceCityData from "@/data/province_city.json";
import roleData from "@/data/category_role.json";
import { createClient, retryRequest } from "@/utils/supabase/client";
import { useSearchParams } from "next/navigation";
import instrumentGroups from '@/data/instruments.js';
import Link from "next/link";
import InfiniteScroll from 'react-infinite-scroll-component';
import { motion, AnimatePresence } from 'framer-motion'; 

// 👈 تابع کمکی برای همسان‌سازی نویسه‌ها و جستجو از ابتدا
const normalizeText = (text: string) => text.toLowerCase().replace(/ی/g, 'ي').replace(/ک/g, 'ك');

const GENDERS = [
  { value: "", label: "همه" },
  { value: "male", label: "مرد" },
  { value: "female", label: "زن" },
  { value: "mixed", label: "مختلط" },
];


interface FilterFormProps {
    isDesktop?: boolean;
    province: string;
    setProvince: (p: string) => void;
    provinceInput: string;
    setProvinceInput: (v: string) => void;
    filteredProvinces: string[];
    provinceRef: React.RefObject<HTMLDivElement | null>;
    handleSelectProvince: (pName: string) => void;

    city: string;
    setCity: (c: string) => void;
    cityInput: string;
    setCityInput: (v: string) => void;
    filteredCities: string[];
    cityRef: React.RefObject<HTMLDivElement | null>;
    handleSelectCity: (cName: string) => void;

    instrument: string;
    setInstrument: (i: string) => void;
    instrumentInput: string;
    setInstrumentInput: (v: string) => void;
    filteredInstruments: any[];
    instrumentRef: React.RefObject<HTMLDivElement | null>;
    handleSelectInstrument: (instObj: any) => void;

    role: string;
    setRole: (r: string) => void;
    category: string;
    setCategory: (c: string) => void;
    gender: string;
    setGender: (g: string) => void;
    readyForCooperate: boolean;
    setReadyForCooperate: (b: boolean) => void;
    lookingForMusician: boolean;
    setLookingForMusician: (b: boolean) => void;
    name: string;
    setName: (n: string) => void;

    allRoles: any[];
    handleApplyFilters: () => void;
    handleClearAll: () => void;
    isMobileFilterOpen: boolean;
    setIsMobileFilterOpen: (b: boolean) => void;


    isProvinceListOpen: boolean;
    isCityListOpen: boolean;
    isInstrumentListOpen: boolean;
    
}

// 👈 کامپوننت FilterForm جدا شده و بهینه شده با React.memo
const FilterForm = React.memo((props: FilterFormProps) => {
    const {
        isDesktop,
        province, provinceInput, setProvinceInput, filteredProvinces, provinceRef, handleSelectProvince,
        city, cityInput, setCityInput, filteredCities, cityRef, handleSelectCity,
        instrument, instrumentInput, setInstrumentInput, filteredInstruments, instrumentRef, handleSelectInstrument,
        role, setRole, category, setCategory, gender, setGender, readyForCooperate, setReadyForCooperate, lookingForMusician, setLookingForMusician, name, setName,
        allRoles, handleApplyFilters, isMobileFilterOpen, setIsMobileFilterOpen, 
    } = props;

    return (
        <div className="space-y-6">
            
            <div className="space-y-3">
                <h2 className="text-base font-semibold text-white border-b border-gray-700 pb-2">جستجوی سریع</h2>
                <div className="grid grid-cols-1 gap-3">
                    
                    {/* Name Search */}
                    <div>
                        <input
                          type="text"
                          placeholder="نام یا نام کاربری"
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100 placeholder-gray-400"
                          value={name}
                          onChange={e => setName(e.target.value)}
                        />
                    </div>
                    
                    {/* Autosuggest استان */}
                    <div className="flex gap-3">
                        <div className="w-1/2 relative" ref={provinceRef}>
                            <input
                                type="text"
                                placeholder={province || "همه استان‌ها"}
                                value={provinceInput}
                                onChange={e => setProvinceInput(e.target.value)}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                            />
                            
                            {/* لیست پیشنهادات استان‌ها */}
                             {provinceInput.length > 0 && filteredProvinces.length > 0 && props.isProvinceListOpen && ( 
                                <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-gray-700 rounded-lg shadow-lg border border-gray-600">
                                    {filteredProvinces.map((pName) => (
                                        <li
                                            key={pName}
                                            className="px-3 py-2 text-sm text-gray-200 hover:bg-orange-500 hover:text-white cursor-pointer"
                                            onClick={() => handleSelectProvince(pName)}
                                        >
                                            {pName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        {/* Autosuggest شهر */}
                        <div className="w-1/2 relative" ref={cityRef}>
                            <input
                                type="text"
                                placeholder={city || "همه شهرها"}
                                value={cityInput}
                                onChange={e => setCityInput(e.target.value)}
                                disabled={!province}
                                className={`w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100 ${!province ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                            
                            {/* لیست پیشنهادات شهرها */}
                            {cityInput.length > 0 && filteredCities.length > 0 && province && props.isCityListOpen && ( // 👈 از props.isCityListOpen استفاده کنید
                                <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-gray-700 rounded-lg shadow-lg border border-gray-600">
                                    {filteredCities.map((cName) => (
                                        <li
                                            key={cName}
                                            className="px-3 py-2 text-sm text-gray-200 hover:bg-orange-500 hover:text-white cursor-pointer"
                                            onClick={() => handleSelectCity(cName)}
                                        >
                                            {cName}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-base font-semibold text-white border-b border-gray-700 pb-2">دسته‌بندی و نقش</h2>
                <div className="grid grid-cols-1 gap-3">
                    
                    {/* Category */}
                    <select
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                    >
                      <option value="">همه دسته‌ها</option>
                      <option value="band">گروه موسیقی</option>
                    </select>

                    {/* Role */}
                    <select
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                      value={role}
                      onChange={e => setRole(e.target.value)}
                    >
                      <option value="">همه عناوین</option>
                      {allRoles.map((r: any) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                </div>
            </div>

            {/* Instrument Section - Autosuggest ساز */}
            <div className="space-y-3">
                <h2 className="text-base font-semibold text-white border-b border-gray-700 pb-2">ساز</h2>
                <div className="grid grid-cols-1 gap-3">
                    <div className="relative" ref={instrumentRef}>
                        <input
                            type="text"
                            placeholder={instrumentInput || "همه سازها"}
                            value={instrumentInput}
                            onChange={e => setInstrumentInput(e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                        />
                        
                        {/* لیست پیشنهادات سازها */}
                       {instrumentInput.length > 0 && filteredInstruments.length > 0 && props.isInstrumentListOpen && ( 
                            <ul className="absolute z-10 w-full mt-1 max-h-40 overflow-y-auto bg-gray-700 rounded-lg shadow-lg border border-gray-600">
                                {filteredInstruments.map((instObj: any) => (
                                    <li
                                        key={instObj.id}
                                        className="px-3 py-2 text-sm text-gray-200 hover:bg-orange-500 hover:text-white cursor-pointer"
                                        onClick={() => handleSelectInstrument(instObj)}
                                    >
                                        {instObj.name}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-base font-semibold text-white border-b border-gray-700 pb-2">جنسیت و وضعیت‌ها</h2>
                <div className="grid grid-cols-1 gap-3">
                    
                    {/* Gender */}
                    <select
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-right bg-gray-900 text-gray-100"
                      value={gender}
                      onChange={e => setGender(e.target.value)}
                    >
                      {GENDERS.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                      ))}
                    </select>

                    {/* Flags */}
                    <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-orange-500"
                            checked={readyForCooperate}
                            onChange={e => setReadyForCooperate(e.target.checked)}
                          />
                          <span className="mr-2 text-gray-200">آماده همکاری</span>
                        </label>
                        <label className="inline-flex items-center text-sm">
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-orange-500"
                            checked={lookingForMusician}
                            onChange={e => setLookingForMusician(e.target.checked)}
                          />
                          <span className="mr-2 text-gray-200">پذیرای همکاری</span>
                        </label>
                    </div>
                </div>
            </div>
            
            {isDesktop && (
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleApplyFilters}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
                >
                  اعمال فیلتر
                </button>
              </div>
            )}

            {!isDesktop && isMobileFilterOpen && (
              <div className="mt-6">
                  <button
                      type="button"
                      onClick={() => { 
                          handleApplyFilters(); 
                          setIsMobileFilterOpen(false); 
                      }}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                      جستجو و اعمال فیلتر
                  </button>
              </div>
            )}
        </div>
    );
});
// -------------------------------------------------------------


export default function AdvancedSearch() {
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  // --- State های ورودی برای Autosuggest ---
  const [provinceInput, setProvinceInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [instrumentInput, setInstrumentInput] = useState("");
  // ----------------------------------------
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [readyForCooperate, setReadyForCooperate] = useState(false);
  const [lookingForMusician, setLookingForMusician] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const searchParams = useSearchParams();
  const [category, setCategory] = useState("");
  const [name, setName] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [instrument, setInstrument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializingRef = useRef(false);
  const isLoadingRef = useRef(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  const [isProvinceListOpen, setIsProvinceListOpen] = useState(false);
  const [isCityListOpen, setIsCityListOpen] = useState(false);
  const [isInstrumentListOpen, setIsInstrumentListOpen] = useState(false);
  const provinceRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const instrumentRef = useRef<HTMLDivElement>(null);

  const cities = provinceCityData.find((p: any) => p["province-fa"] === province)?.cities || [];
  const allRoles = roleData.flatMap((cat: any) => cat.roles).filter(Boolean);
  const allInstruments = instrumentGroups.flatMap(g =>
    g.instruments ? g.instruments : (g.subgroups ? g.subgroups.flatMap(sg => sg.instruments) : [])
  );

  const hasActiveFilters = province || city || role || gender || category || instrument || name || readyForCooperate || lookingForMusician;

  const PAGE_SIZE = 12;


  // --- Callbacks برای مدیریت ورودی‌ها (برای جلوگیری از ری‌رندر شدن مداوم) ---
  const handleSetProvinceInput = useCallback((value: string) => {
    setProvinceInput(value);
    setIsProvinceListOpen(value.length > 0);
    if (value === "") {
        setProvince("");
        setCity("");
        setCityInput("");
        setIsCityListOpen(false);
    }
  }, [setProvince, setCity, setCityInput]);
  
  const handleSetCityInput = useCallback((value: string) => {
    setCityInput(value);
    setIsCityListOpen(value.length > 0);
    if (value === "") setCity("");
  }, [setCity]);
  
  const handleSetInstrumentInput = useCallback((value: string) => {
    setInstrumentInput(value);
    setIsInstrumentListOpen(value.length > 0);
    if (value === "") setInstrument("");
  }, [setInstrument]);
  
  // --- Callbacks برای انتخاب آیتم از لیست پیشنهادی ---
  const handleSelectProvince = useCallback((pName: string) => {
    setProvince(pName);
    setProvinceInput(pName);
    setCity("");
    setCityInput("");
    setIsProvinceListOpen(false);
  }, []);

  const handleSelectCity = useCallback((cName: string) => {
    setCity(cName);
    setCityInput(cName);
    setIsCityListOpen(false);
  }, []);

  const handleSelectInstrument = useCallback((instObj: any) => {
    setInstrument(instObj.id);
    setInstrumentInput(instObj.name);
    setIsInstrumentListOpen(false);
  }, []);
  
  // --- منطق فیلترینگ (با استفاده از useMemo برای عملکرد بهتر) ---
  const normalizedProvinceInput = normalizeText(provinceInput);
  const normalizedCityInput = normalizeText(cityInput);
  const normalizedInstrumentInput = normalizeText(instrumentInput);

  const filteredProvinces = useMemo(() => provinceCityData
    .map((p: any) => p["province-fa"])
    .filter(pName => 
      pName.length > 0 && normalizedProvinceInput.length > 0 && normalizeText(pName).startsWith(normalizedProvinceInput)
    ), [normalizedProvinceInput]);

  const filteredCities = useMemo(() => cities
    .map((c: any) => c["city-fa"])
    .filter(cName => 
      cName.length > 0 && normalizedCityInput.length > 0 && normalizeText(cName).startsWith(normalizedCityInput)
    ), [normalizedCityInput, cities]);

  const filteredInstruments = useMemo(() => allInstruments.filter((i: any) =>
    i.name && normalizedInstrumentInput.length > 0 && normalizeText(i.name).startsWith(normalizedInstrumentInput)
  ), [normalizedInstrumentInput, allInstruments]);


  const fetchProfiles = async (pageNum = 1, append = false, initialFilters?: any) => {
    
    if (isLoadingRef.current) {
      return;
    }
    
    isLoadingRef.current = true;
    setLoading(true);
    setError(null);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      isLoadingRef.current = false;
      setLoading(false);
      setError("درخواست با مشکل مواجه شد. لطفاً دوباره تلاش کنید.");
    }, 10000);
    
    try {
      const supabase = createClient();
      
      const executeQuery = async () => {
        
        let query = supabase
          .from("profiles")
          .select(
            instrument
              ? "id, name, display_name, avatar_url, province, city, category, roles, ready_for_cooperate, looking_for_musician, profile_instruments!inner(instrument_id, type)"
              : "id, name, display_name, avatar_url, province, city, category, roles, ready_for_cooperate, looking_for_musician, profile_instruments(instrument_id, type)"
          )
          .eq('is_complete', true)
          .not('avatar_url', 'is', null)
          .neq('avatar_url', '');
        
        query = query.order('updated_at', { ascending: false }).order('display_name', { ascending: true });

        const { count: totalCount, error: countError } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq('is_complete', true);
        
        
        if (countError) {
          console.error('Count query failed:', countError);
          throw new Error('خطا در دریافت تعداد پروفایل‌ها');
        }
        
        const filters = initialFilters || {
          name,
          province,
          city,
          role,
          category,
          instrument,
          gender,
          readyForCooperate,
          lookingForMusician
        };
        
        if (filters.name) {
          // 👈 جستجوی پیشوندی (Start With) برای نام
          query = query.or(`name.ilike.${filters.name}%,display_name.ilike.${filters.name}%`);
        }
        if (filters.province) {
          query = query.eq("province", filters.province);
        }
        if (filters.city) {
          query = query.eq("city", filters.city);
        }
        if (filters.role) {
          query = query.contains("roles", [filters.role]);
        }
        if (filters.category === 'band') {
          query = query.eq("category", 'band');
        }
        if (filters.gender) {
          query = query.eq("gender", filters.gender);
        }
        if (filters.readyForCooperate) {
          query = query.eq("ready_for_cooperate", true);
        }
        if (filters.lookingForMusician) {
          query = query.eq("looking_for_musician", true);
        }
        if (filters.instrument) {
          query = query.eq("profile_instruments.instrument_id", filters.instrument);
        }

        const start = (pageNum - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;
        query = query.range(start, end);
        
        const { data, error: supabaseError, count } = await query;
        if (supabaseError) {
          console.error('Supabase error:', supabaseError);
          throw new Error('خطا در دریافت اطلاعات');
        }
        
        return { data, count };
      };
      
      const { data, count } = await retryRequest(executeQuery, 3, 1000);
      
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
      
    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setResults([]);
      setHasMore(false);
      setError(err instanceof Error ? err.message : "خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  };


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
    const { resetClient } = require('@/utils/supabase/client');
    resetClient();
  };

  const fetchNext = () => {
    if (!isLoadingRef.current && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProfiles(nextPage, true);
    }
  };
  
  const handleApplyFilters = () => {
    setPage(1);
    fetchProfiles(1, false);
  };
  
  const handleClearAll = () => {
    setName("");
    setProvince("");
    setCity("");
    setRole("");
    setGender("");
    setCategory("");
    setReadyForCooperate(false);
    setLookingForMusician(false);
    setInstrument("");
    setProvinceInput("");
    setCityInput("");
    setInstrumentInput("");
    
    setPage(1);
    fetchProfiles(1, false, {}); 
  };


  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const initializeAndFetch = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        const provinceParam = searchParams.get("province");
        const cityParam = searchParams.get("city");
        const roleParam = searchParams.get("role");
        const genderParam = searchParams.get("gender");
        const categoryParam = searchParams.get("category");
        const nameParam = searchParams.get("name");
        const readyParam = searchParams.get("ready");
        const lookingParam = searchParams.get("looking");
        const instrumentParam = searchParams.get("instrument");

        const filters = {
          province: provinceParam || "",
          city: cityParam || "",
          role: roleParam || "",
          gender: genderParam || "",
          category: categoryParam || "",
          name: nameParam || "",
          readyForCooperate: readyParam === "1",
          lookingForMusician: lookingParam === "1",
          instrument: instrumentParam || ""
        };

        setProvince(filters.province);
        setCity(filters.city);
        setProvinceInput(filters.province);
        setCityInput(filters.city);
        if (filters.instrument) {
            const instObj = allInstruments.find(i => i.id === filters.instrument);
            setInstrumentInput(instObj ? instObj.name : "");
        }
        
        setRole(filters.role);
        setGender(filters.gender);
        setCategory(filters.category);
        setName(filters.name);
        setReadyForCooperate(filters.readyForCooperate);
        setLookingForMusician(filters.lookingForMusician);
        setInstrument(filters.instrument);

        setIsInitialized(true);
        fetchProfiles(1, false, filters);
      } catch (e) {
        console.error('Initialization failed:', e);
      }
    };

    initializeAndFetch();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      isInitializingRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // --- مدیریت بستن لیست پیشنهادات با کلیک در بیرون (رفع خطای null) ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        
        // 👈 اطمینان از وجود provinceRef.current
        if (provinceRef.current && !provinceRef.current.contains(target)) {
          if (provinceInput && provinceInput !== province) {
            if (province) setProvinceInput(province);
            else setProvinceInput("");
          }
          setIsProvinceListOpen(false);
        }
        
        // 👈 اطمینان از وجود cityRef.current
        if (cityRef.current && !cityRef.current.contains(target)) {
          if (cityInput && cityInput !== city) {
            if (city) setCityInput(city);
            else setCityInput("");
          }
          setIsCityListOpen(false);
        }
        
        // 👈 اطمینان از وجود instrumentRef.current
        if (instrumentRef.current && !instrumentRef.current.contains(target)) {
          if (instrumentInput && instrumentInput !== instrument) {
            if (instrument) {
               const instObj = allInstruments.find(i => i.id === instrument);
               setInstrumentInput(instObj ? instObj.name : "");
            } else {
               setInstrumentInput("");
            }
          }
          setIsInstrumentListOpen(false);
        }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [province, city, instrument, allInstruments, provinceInput, cityInput, instrumentInput]);


  
  return (
    <div className="max-w-full lg:max-w-7xl mx-auto px-4"> 
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">اعضاء</h1>
        
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="lg:hidden flex items-center justify-center gap-2 bg-white text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          فیلترها
        </button>
      </div>

      
      <div className="flex gap-6">
        
        <div 
          className="hidden lg:block lg:w-[300px] h-fit sticky top-[120px] bg-gray-800 rounded-xl shadow-md p-6"
        >
          {/* 👈 فراخوانی FilterForm */}
          <FilterForm 
            isDesktop={true}
            isProvinceListOpen={isProvinceListOpen} 
            isCityListOpen={isCityListOpen} 
            isInstrumentListOpen={isInstrumentListOpen}
            province={province} setProvince={setProvince} provinceInput={provinceInput} setProvinceInput={handleSetProvinceInput} filteredProvinces={filteredProvinces} provinceRef={provinceRef} handleSelectProvince={handleSelectProvince}
            city={city} setCity={setCity} cityInput={cityInput} setCityInput={handleSetCityInput} filteredCities={filteredCities} cityRef={cityRef} handleSelectCity={handleSelectCity}
            instrument={instrument} setInstrument={setInstrument} instrumentInput={instrumentInput} setInstrumentInput={handleSetInstrumentInput} filteredInstruments={filteredInstruments} instrumentRef={instrumentRef} handleSelectInstrument={handleSelectInstrument}
            role={role} setRole={setRole} category={category} setCategory={setCategory} gender={gender} setGender={setGender} readyForCooperate={readyForCooperate} setReadyForCooperate={setReadyForCooperate} lookingForMusician={lookingForMusician} setLookingForMusician={setLookingForMusician} name={name} setName={setName}
            allRoles={allRoles} handleApplyFilters={handleApplyFilters} handleClearAll={handleClearAll} isMobileFilterOpen={isMobileFilterOpen} setIsMobileFilterOpen={setIsMobileFilterOpen}
          />
        </div>
        
        
        <div className="flex-1">
          
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
                  <button onClick={() => { setProvince(""); setCity(""); setProvinceInput(""); setCityInput(""); }} className="hover:text-orange-200">×</button>
                </span>
              )}
              {city && (
                <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  {city}
                  <button onClick={() => { setCity(""); setCityInput(""); }} className="hover:text-orange-200">×</button>
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
                  <button onClick={() => { setInstrument(""); setInstrumentInput(""); }} className="hover:text-orange-200">×</button>
                </span>
              )}
              <button
                onClick={handleClearAll} 
                className="bg-gray-700 text-gray-300 hover:bg-gray-600 px-3 py-1 rounded-full text-sm"
              >
                پاک کردن همه
              </button>
            </div>
          )}
          
          
          {/* Results */}
          <div>
            {error && (
              <div className="bg-red-900 text-red-100 p-4 rounded mb-4">{error}</div>
            )}

            {!loading && results.length === 0 && (
              <div className="text-center text-gray-400">موردی یافت نشد.</div>
            )}

            <InfiniteScroll
              dataLength={results.length}
              next={fetchNext}
              hasMore={hasMore}
              loader={<div className="text-center text-gray-400 py-4">در حال بارگذاری...</div>}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"> 
                {results.map((profile: any) => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.display_name}`}
                    className="block h-full"
                  >
                    <div className="bg-gray-800 rounded-xl hover:shadow-lg transition border border-gray-700 cursor-pointer hover:border-orange-500">
                      <div className="w-full relative" style={{ paddingBottom: '100%' }}>
                        <img
                          src={profile.avatar_url || '/default-avatar.png'}
                          alt={profile.name || profile.display_name}
                          className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
                        />
                      </div>
                      <div className="p-4 w-full flex-1 flex flex-col min-h-[140px]">
                        <div className="font-bold text-lg text-white mb-2 line-clamp-1">{profile.name || profile.display_name}</div>
                        <div className="text-sm text-gray-300 mb-2 line-clamp-1">{profile.city || ''}{profile.city && profile.province ? '، ' : ''}{profile.province || ''}</div>
                        <div className="text-sm text-gray-400 mb-auto line-clamp-1">
                          {profile.category === 'band' ? (
                            <span>گروه موسیقی</span>
                          ) : (
                            Array.isArray(profile.roles) && profile.roles.length > 0
                              ? profile.roles.map((r: string, idx: number) => {
                                  const roleObj = allRoles.find((ar: any) => ar.value === r);
                                  let label = roleObj ? roleObj.label : r;
                                  if ((r === 'musician' || r === 'teacher') && Array.isArray((profile as any).profile_instruments) && (profile as any).profile_instruments.length > 0) {
                                    const firstInst = (profile as any).profile_instruments.find((pi: any) => pi.type === r) || (profile as any).profile_instruments[0];
                                    if (firstInst?.instrument_id) {
                                      const instName = allInstruments.find(i => i.id === firstInst.instrument_id)?.name || firstInst.instrument_id;
                                      label = `${label}${instName ? ` (${instName})` : ''}`;
                                    }
                                  }
                                  return <span key={r}>{label}{idx < profile.roles.length - 1 ? ' / ' : ''}</span>;
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
          </div>
          
        </div>
        
      </div>
      
      {/* 3. مودال فیلترها برای موبایل (بدون تغییر) */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-gray-900 bg-opacity-95 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-md bg-gray-800 h-full overflow-y-auto p-6 relative"
            >
              <h2 className="text-2xl font-bold text-white mb-6 border-b border-gray-700 pb-4">فیلترهای جستجو</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="absolute top-6 left-6 text-gray-400 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              {/* 👈 فراخوانی FilterForm */}
              <FilterForm 
                isDesktop={false}
                isProvinceListOpen={isProvinceListOpen} 
                isCityListOpen={isCityListOpen} 
                isInstrumentListOpen={isInstrumentListOpen}
                province={province} setProvince={setProvince} provinceInput={provinceInput} setProvinceInput={handleSetProvinceInput} filteredProvinces={filteredProvinces} provinceRef={provinceRef} handleSelectProvince={handleSelectProvince}
                city={city} setCity={setCity} cityInput={cityInput} setCityInput={handleSetCityInput} filteredCities={filteredCities} cityRef={cityRef} handleSelectCity={handleSelectCity}
                instrument={instrument} setInstrument={setInstrument} instrumentInput={instrumentInput} setInstrumentInput={handleSetInstrumentInput} filteredInstruments={filteredInstruments} instrumentRef={instrumentRef} handleSelectInstrument={handleSelectInstrument}
                role={role} setRole={setRole} category={category} setCategory={setCategory} gender={gender} setGender={setGender} readyForCooperate={readyForCooperate} setReadyForCooperate={setReadyForCooperate} lookingForMusician={lookingForMusician} setLookingForMusician={setLookingForMusician} name={name} setName={setName}
                allRoles={allRoles} handleApplyFilters={handleApplyFilters} handleClearAll={handleClearAll} isMobileFilterOpen={isMobileFilterOpen} setIsMobileFilterOpen={setIsMobileFilterOpen}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}