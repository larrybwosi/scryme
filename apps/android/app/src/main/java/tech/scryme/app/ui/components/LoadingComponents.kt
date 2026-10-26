package tech.scryme.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Enhanced shimmer gradient brush with smooth multi-stop animation.
 */
@Composable
fun shimmerBrush(targetValue: Float = 1200f): Brush {
    val shimmerColors = listOf(
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f),
        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.12f),
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.85f),
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
    )

    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation by transition.animateFloat(
        initialValue = -300f,
        targetValue = targetValue,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1300, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )

    return Brush.linearGradient(
        colors = shimmerColors,
        start = Offset(x = translateAnimation - 300f, y = translateAnimation - 300f),
        end = Offset(x = translateAnimation, y = translateAnimation)
    )
}

/**
 * Animated Shimmer placeholder container.
 */
@Composable
fun ShimmerBox(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 6.dp
) {
    val brush = shimmerBrush()
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(brush)
    )
}

/**
 * Enterprise bordered card loading skeleton.
 */
@Composable
fun CardSkeleton(
    modifier: Modifier = Modifier,
    height: Dp = 100.dp,
    titleRatio: Float = 0.6f
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surface,
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.6f)),
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    ShimmerBox(modifier = Modifier.size(38.dp), cornerRadius = 19.dp)
                    Column(
                        verticalArrangement = Arrangement.spacedBy(6.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        ShimmerBox(modifier = Modifier.fillMaxWidth(titleRatio).height(16.dp))
                        ShimmerBox(modifier = Modifier.fillMaxWidth(0.4f).height(12.dp))
                    }
                }
                ShimmerBox(modifier = Modifier.width(70.dp).height(28.dp), cornerRadius = 6.dp)
            }
            Spacer(modifier = Modifier.height(2.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth().height(12.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.75f).height(12.dp))
        }
    }
}

/**
 * Dynamic staggered list loading skeleton.
 */
@Composable
fun ListSkeleton(
    count: Int = 4,
    modifier: Modifier = Modifier,
    itemHeight: Dp = 100.dp
) {
    val titleRatios = listOf(0.65f, 0.45f, 0.75f, 0.55f)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        repeat(count) { index ->
            val ratio = titleRatios[index % titleRatios.size]
            CardSkeleton(height = itemHeight, titleRatio = ratio)
        }
    }
}

/**
 * Profile and user account loading skeleton.
 */
@Composable
fun ProfileSkeleton(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        ShimmerBox(modifier = Modifier.size(88.dp), cornerRadius = 44.dp)
        ShimmerBox(modifier = Modifier.width(180.dp).height(20.dp), cornerRadius = 4.dp)
        ShimmerBox(modifier = Modifier.width(120.dp).height(14.dp), cornerRadius = 4.dp)
        Spacer(modifier = Modifier.height(8.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            ShimmerBox(modifier = Modifier.weight(1f).height(42.dp), cornerRadius = 8.dp)
            ShimmerBox(modifier = Modifier.weight(1f).height(42.dp), cornerRadius = 8.dp)
        }

        Spacer(modifier = Modifier.height(8.dp))
        CardSkeleton(titleRatio = 0.7f)
        CardSkeleton(titleRatio = 0.5f)
    }
}
