package tech.scryme.app.util

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class CalendarDay(
    val date: Date,
    val dateString: String,
    val dayOfMonth: Int,
    val dayOfWeekName: String,
    val isToday: Boolean,
    val isSelected: Boolean
)

object DateUtils {
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val monthYearFormat = SimpleDateFormat("MMMM yyyy", Locale.US)
    private val dayOfWeekFormat = SimpleDateFormat("EEE", Locale.US)
    private val displayDateFormat = SimpleDateFormat("MMM d, yyyy", Locale.US)

    fun getTodayString(): String = isoFormat.format(Date())

    fun formatDate(date: Date): String = isoFormat.format(date)

    fun formatDisplayDate(date: Date): String = displayDateFormat.format(date)

    fun formatMonthYear(calendar: Calendar): String = monthYearFormat.format(calendar.time)

    fun parseDate(dateStr: String): Date? {
        return try {
            isoFormat.parse(dateStr)
        } catch (e: Exception) {
            null
        }
    }

    fun getWeekDays(referenceDate: Date, selectedDateStr: String): List<CalendarDay> {
        val cal = Calendar.getInstance().apply {
            time = referenceDate
            firstDayOfWeek = Calendar.MONDAY
            set(Calendar.DAY_OF_WEEK, Calendar.MONDAY)
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val todayStr = getTodayString()
        val days = mutableListOf<CalendarDay>()

        for (i in 0 until 7) {
            val date = cal.time
            val dStr = isoFormat.format(date)
            days.add(
                CalendarDay(
                    date = date,
                    dateString = dStr,
                    dayOfMonth = cal.get(Calendar.DAY_OF_MONTH),
                    dayOfWeekName = dayOfWeekFormat.format(date).uppercase(Locale.US),
                    isToday = dStr == todayStr,
                    isSelected = dStr == selectedDateStr
                )
            )
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        return days
    }

    fun getMonthGrid(year: Int, month: Int, selectedDateStr: String): List<CalendarDay> {
        val cal = Calendar.getInstance().apply {
            set(Calendar.YEAR, year)
            set(Calendar.MONTH, month)
            set(Calendar.DAY_OF_MONTH, 1)
            firstDayOfWeek = Calendar.MONDAY
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }

        while (cal.get(Calendar.DAY_OF_WEEK) != Calendar.MONDAY) {
            cal.add(Calendar.DAY_OF_MONTH, -1)
        }

        val todayStr = getTodayString()
        val days = mutableListOf<CalendarDay>()

        for (i in 0 until 42) {
            val date = cal.time
            val dStr = isoFormat.format(date)
            days.add(
                CalendarDay(
                    date = date,
                    dateString = dStr,
                    dayOfMonth = cal.get(Calendar.DAY_OF_MONTH),
                    dayOfWeekName = dayOfWeekFormat.format(date).uppercase(Locale.US),
                    isToday = dStr == todayStr,
                    isSelected = dStr == selectedDateStr
                )
            )
            cal.add(Calendar.DAY_OF_MONTH, 1)
        }
        return days
    }
}
