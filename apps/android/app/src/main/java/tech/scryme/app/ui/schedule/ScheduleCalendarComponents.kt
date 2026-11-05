package tech.scryme.app.ui.schedule

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForwardIos
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBackIosNew
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import tech.scryme.app.domain.model.StaffShift
import tech.scryme.app.domain.model.TimelineItem
import tech.scryme.app.domain.model.UserProfile
import tech.scryme.app.ui.components.MemberAvatar
import tech.scryme.app.ui.theme.Emerald500
import tech.scryme.app.ui.theme.Indigo500
import tech.scryme.app.util.CalendarDay
import java.util.Calendar

private val PrimaryIndigo = Color(0xFF6366F1)
private val TextMutedColor = Color(0xFF94A3B8)
private val TimelineLineColor = Color(0xFF334155)

@Composable
fun ScheduleCalendarHeader(
    monthTitle: String,
    onMonthClick: () -> Unit,
    onTodayClick: () -> Unit,
    onAddClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 4.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier
                .clip(RoundedCornerShape(8.dp))
                .clickable { onMonthClick() }
                .padding(horizontal = 8.dp, vertical = 6.dp)
        ) {
            Text(
                text = monthTitle,
                style = MaterialTheme.typography.titleLarge.copy(
                    fontWeight = FontWeight.Bold,
                    fontSize = 20.sp
                ),
                color = MaterialTheme.colorScheme.onBackground
            )
            Spacer(modifier = Modifier.width(4.dp))
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = "Select Month",
                tint = MaterialTheme.colorScheme.onBackground,
                modifier = Modifier.size(20.dp)
            )
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)),
                modifier = Modifier.clickable { onTodayClick() }
            ) {
                Text(
                    text = "Today",
                    style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                    color = MaterialTheme.colorScheme.onSurface,
                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
                )
            }

            FilledIconButton(
                onClick = onAddClick,
                colors = IconButtonDefaults.filledIconButtonColors(
                    containerColor = PrimaryIndigo
                ),
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = "Add Task / Shift",
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
fun WeekStrip(
    days: List<CalendarDay>,
    onDaySelected: (String) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        days.forEach { day ->
            DayItem(
                day = day,
                onClick = { onDaySelected(day.dateString) }
            )
        }
    }
}

@Composable
private fun DayItem(
    day: CalendarDay,
    onClick: () -> Unit
) {
    val isSelected = day.isSelected
    val backgroundColor = if (isSelected) PrimaryIndigo else Color.Transparent
    val textColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onBackground
    val dayOfWeekColor = if (isSelected) Color.White.copy(alpha = 0.8f) else TextMutedColor

    Column(
        modifier = Modifier
            .width(46.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .clickable { onClick() }
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = day.dayOfWeekName.take(3),
            style = MaterialTheme.typography.labelSmall.copy(
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold
            ),
            color = dayOfWeekColor
        )
        Spacer(modifier = Modifier.height(6.dp))
        Text(
            text = "${day.dayOfMonth}",
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = if (isSelected || day.isToday) FontWeight.Bold else FontWeight.Medium,
                fontSize = 16.sp
            ),
            color = textColor
        )
        if (day.isToday && !isSelected) {
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .size(4.dp)
                    .background(PrimaryIndigo, CircleShape)
            )
        }
    }
}

@Composable
fun MonthGridModal(
    monthCalendar: Calendar,
    days: List<CalendarDay>,
    onDaySelected: (String) -> Unit,
    onPreviousMonth: () -> Unit,
    onNextMonth: () -> Unit,
    onDismiss: () -> Unit
) {
    val monthYearText = java.text.SimpleDateFormat("MMMM yyyy", java.util.Locale.US).format(monthCalendar.time)

    AlertDialog(
        onDismissRequest = onDismiss,
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close", color = PrimaryIndigo)
            }
        },
        title = {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onPreviousMonth) {
                    Icon(
                        imageVector = Icons.Default.ArrowBackIosNew,
                        contentDescription = "Previous Month",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Text(
                    text = monthYearText,
                    style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                    color = MaterialTheme.colorScheme.onSurface
                )
                IconButton(onClick = onNextMonth) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ArrowForwardIos,
                        contentDescription = "Next Month",
                        tint = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    listOf("M", "T", "W", "T", "F", "S", "S").forEach { label ->
                        Text(
                            text = label,
                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                            color = TextMutedColor,
                            modifier = Modifier.width(32.dp),
                            textAlign = TextAlign.Center
                        )
                    }
                }
                Spacer(modifier = Modifier.height(8.dp))

                val chunkedDays = days.chunked(7)
                chunkedDays.forEach { week ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        horizontalArrangement = Arrangement.SpaceAround
                    ) {
                        week.forEach { d ->
                            val isSelected = d.isSelected
                            val calD = Calendar.getInstance().apply { time = d.date }
                            val isCurrentMonth = calD.get(Calendar.MONTH) == monthCalendar.get(Calendar.MONTH)
                            val textColor = when {
                                isSelected -> Color.White
                                !isCurrentMonth -> TextMutedColor.copy(alpha = 0.4f)
                                d.isToday -> PrimaryIndigo
                                else -> MaterialTheme.colorScheme.onSurface
                            }
                            val bgModifier = if (isSelected) {
                                Modifier.background(PrimaryIndigo, CircleShape)
                            } else {
                                Modifier
                            }

                            Box(
                                modifier = Modifier
                                    .size(32.dp)
                                    .then(bgModifier)
                                    .clip(CircleShape)
                                    .clickable {
                                        onDaySelected(d.dateString)
                                        onDismiss()
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "${d.dayOfMonth}",
                                    style = MaterialTheme.typography.bodySmall.copy(
                                        fontWeight = if (isSelected || d.isToday) FontWeight.Bold else FontWeight.Normal
                                    ),
                                    color = textColor,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }
            }
        }
    )
}

@Composable
fun ScheduleTimeline(
    items: List<TimelineItem>,
    members: List<UserProfile>,
    onToggleTaskCompletion: (String) -> Unit,
    onTaskClick: (String) -> Unit,
    onShiftClick: (StaffShift) -> Unit,
    modifier: Modifier = Modifier
) {
    if (items.isEmpty()) {
        Box(
            modifier = modifier
                .fillMaxWidth()
                .padding(vertical = 48.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Default.CalendarMonth,
                    contentDescription = null,
                    tint = TextMutedColor.copy(alpha = 0.6f),
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    text = "No scheduled items for this day",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextMutedColor
                )
            }
        }
    } else {
        LazyColumn(
            modifier = modifier.fillMaxSize(),
            contentPadding = PaddingValues(top = 12.dp, bottom = 80.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(items, key = { it.id }) { item ->
                when (item) {
                    is TimelineItem.TaskItem -> {
                        val assignee = members.find { it.id == item.assignedMemberId }
                        TimelineTaskCard(
                            item = item,
                            assignee = assignee,
                            onToggleCompletion = { onToggleTaskCompletion(item.task.id) },
                            onClick = { onTaskClick(item.task.id) }
                        )
                    }
                    is TimelineItem.ShiftItem -> {
                        TimelineShiftCard(
                            item = item,
                            onClick = { onShiftClick(item.shift) }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TimelineTaskCard(
    item: TimelineItem.TaskItem,
    assignee: UserProfile?,
    onToggleCompletion: () -> Unit,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(58.dp)
        ) {
            Text(
                text = item.timeDisplay,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 11.sp
                ),
                color = TextMutedColor
            )
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(if (item.isCompleted) Emerald500 else PrimaryIndigo, CircleShape)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(1.5.dp)
                    .height(68.dp)
                    .background(TimelineLineColor)
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
            modifier = Modifier
                .weight(1f)
                .padding(bottom = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (!item.category.isNullOrBlank()) {
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = PrimaryIndigo.copy(alpha = 0.12f)
                        ) {
                            Text(
                                text = item.category,
                                style = MaterialTheme.typography.labelSmall.copy(
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 10.sp
                                ),
                                color = PrimaryIndigo,
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                            )
                        }
                    } else {
                        Spacer(modifier = Modifier.width(1.dp))
                    }

                    IconButton(
                        onClick = onToggleCompletion,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(20.dp)
                                .clip(CircleShape)
                                .border(
                                    width = 1.5.dp,
                                    color = if (item.isCompleted) Emerald500 else TextMutedColor,
                                    shape = CircleShape
                                )
                                .background(if (item.isCompleted) Emerald500 else Color.Transparent),
                            contentAlignment = Alignment.Center
                        ) {
                            if (item.isCompleted) {
                                Icon(
                                    imageVector = Icons.Default.Check,
                                    contentDescription = "Completed",
                                    tint = Color.White,
                                    modifier = Modifier.size(12.dp)
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    if (assignee != null) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            MemberAvatar(
                                avatarUrl = assignee.avatarUrl,
                                name = assignee.name,
                                modifier = Modifier.size(24.dp)
                            )
                            Text(
                                text = assignee.name,
                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                                color = TextMutedColor
                            )
                        }
                    } else {
                        Text(
                            text = item.priority,
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.SemiBold,
                                fontSize = 10.sp
                            ),
                            color = TextMutedColor
                        )
                    }

                    if (item.breakdownTotal > 0) {
                        Text(
                            text = "${item.breakdownCompleted}/${item.breakdownTotal} subtasks",
                            style = MaterialTheme.typography.labelSmall.copy(fontSize = 11.sp),
                            color = TextMutedColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TimelineShiftCard(
    item: TimelineItem.ShiftItem,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.width(58.dp)
        ) {
            Text(
                text = item.shift.startTime,
                style = MaterialTheme.typography.labelSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 11.sp
                ),
                color = TextMutedColor
            )
            Spacer(modifier = Modifier.height(6.dp))
            Box(
                modifier = Modifier
                    .size(10.dp)
                    .background(Color(0xFF06B6D4), CircleShape)
            )
            Spacer(modifier = Modifier.height(4.dp))
            Box(
                modifier = Modifier
                    .width(1.5.dp)
                    .height(68.dp)
                    .background(TimelineLineColor)
            )
        }

        Spacer(modifier = Modifier.width(8.dp))

        Surface(
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surface,
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
            modifier = Modifier
                .weight(1f)
                .padding(bottom = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = Color(0xFF06B6D4).copy(alpha = 0.12f)
                    ) {
                        Text(
                            text = "WORKING SHIFT",
                            style = MaterialTheme.typography.labelSmall.copy(
                                fontWeight = FontWeight.Bold,
                                fontSize = 10.sp
                            ),
                            color = Color(0xFF06B6D4),
                            modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                        )
                    }

                    Icon(
                        imageVector = Icons.Default.Schedule,
                        contentDescription = null,
                        tint = TextMutedColor,
                        modifier = Modifier.size(16.dp)
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Text(
                    text = "${item.shift.startTime} - ${item.shift.endTime}",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 15.sp
                    ),
                    color = MaterialTheme.colorScheme.onSurface
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = if (item.breaksCount > 0) "${item.breaksCount} breaks scheduled" else "No breaks scheduled",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = TextMutedColor
                )
            }
        }
    }
}
