// Monkey patch fetch to handle Supabase errors silently
const originalFetch = window.fetch

window.fetch = async function(...args) {
  try {
    const response = await originalFetch.apply(this, args)
    // اگر درخواست به Supabase است و خطای 400 دارد، خطا را مخفی کن
    if (args[0]?.toString().includes('supabase') && response.status === 400) {
      return response
    }
    return response
  } catch (error) {
    if (args[0]?.toString().includes('supabase')) {
      // برای درخواست‌های Supabase، خطا را بدون لاگ کردن برمی‌گردانیم
      return new Response(null, { status: 400 })
    }
    throw error
  }
}

export default window.fetch 