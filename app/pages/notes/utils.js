export function useEtfData() {
    const currentDate = ref('')
    const dailyData = ref(null)
    const noteText = ref('')
    const loading = ref(false)
    const error = ref('')
  
    // 加载单日数据
    async function loadDailyData(date) {
      loading.value = true
      error.value = ''
      try {
        const res = await fetch(`/etf-data/${date}.json`)
        if (!res.ok) throw new Error('数据不存在')
        dailyData.value = await res.json()
        currentDate.value = date
      } catch (e) {
        error.value = e.message || '加载失败'
        dailyData.value = {}
        currentDate.value = date
      } finally {
        loading.value = false
      }
    }
  
    // 加载笔记
    async function loadNote(date) {
      try {
        const res = await fetch('/etf-data/notes.json')
        const notes = await res.json()
        noteText.value = notes[date] || ''
      } catch {
        noteText.value = ''
      }
    }
  
    // 切换日期
    async function changeDate(date) {
      await Promise.all([
        loadDailyData(date),
        loadNote(date)
      ])
    }
  
    // 日期加减
    function offsetDate(dateStr, days) {
      const d = new Date(dateStr)
      d.setDate(d.getDate() + days)
      return d.toISOString().slice(0, 10)
    }
  
    return {
      currentDate,
      dailyData,
      noteText,
      loading,
      error,
      changeDate,
      offsetDate
    }
  }