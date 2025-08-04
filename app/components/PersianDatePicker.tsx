'use client'

import DatePicker, { DayValue, utils, Day } from '@hassanmojab/react-modern-calendar-datepicker'
import '@hassanmojab/react-modern-calendar-datepicker/lib/DatePicker.css'

const styles = {
  wrapper: 'DatePicker',
  calendar: 'Calendar bg-gray-900 border-gray-700',
  input: 'DatePicker__input w-full rounded-md px-3 py-2 focus:outline-none bg-gray-800 text-white border-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500',
}

interface PersianDatePickerProps {
  value: Day | null;
  onChange: (day: Day | null) => void;
  inputPlaceholder?: string;
  minimumDate?: Day;
}

export default function PersianDatePicker({
  value,
  onChange,
  inputPlaceholder = "انتخاب تاریخ",
  minimumDate = utils('fa').getToday(),
}: PersianDatePickerProps) {
  return (
    <DatePicker
      value={value}
      onChange={onChange}
      shouldHighlightWeekends
      locale="fa"
      inputPlaceholder={inputPlaceholder}
      colorPrimary="#f97316"
      wrapperClassName={styles.wrapper}
      calendarClassName={styles.calendar}
      inputClassName={styles.input}
      minimumDate={minimumDate}
    />
  )
}

// Add this CSS block at the end of the file
const cssBlock = `
.DatePicker {
  position: relative;
}

.DatePicker__input {
  background-color: rgb(31, 41, 55) !important;
  color: white !important;
  border-color: rgb(75, 85, 99) !important;
}

.DatePicker__input::placeholder {
  color: rgb(156, 163, 175) !important;
}

.DatePicker__input:focus {
  border-color: rgb(249, 115, 22) !important;
  box-shadow: 0 0 0 1px rgb(249, 115, 22) !important;
}

.Calendar {
  background-color: rgb(31, 41, 55) !important;
  border-color: rgb(75, 85, 99) !important;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
}

.Calendar__header {
  color: white !important;
}

.Calendar__weekDays {
  color: rgb(156, 163, 175) !important;
}

.Calendar__day {
  color: white !important;
  transition: all 0.2s ease;
}

.Calendar__day:hover {
  background-color: rgb(55, 65, 81) !important;
}

.Calendar__day.-selected {
  background-color: rgb(249, 115, 22) !important;
  color: white !important;
}

.Calendar__day.-selectedStart,
.Calendar__day.-selectedEnd {
  background-color: rgb(249, 115, 22) !important;
  color: white !important;
}

.Calendar__day.-today:not(.-selectedStart):not(.-selectedEnd):not(.-selectedBetween) {
  color: rgb(249, 115, 22) !important;
  font-weight: bold;
}

.Calendar__day.-disabled {
  color: rgb(107, 114, 128) !important;
}

.Calendar__monthArrowWrapper:hover {
  background-color: rgb(55, 65, 81) !important;
}
`

// Create a style element and append it to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = cssBlock
  document.head.appendChild(style)
} 