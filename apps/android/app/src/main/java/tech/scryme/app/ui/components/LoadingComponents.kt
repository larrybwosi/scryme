package tech.scryme.app.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

@Composable
fun shimmerBrush(targetValue: Float = 1000f): Brush {
    val shimmerColors = listOf(
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.2f),
        MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f),
    )

    val transition = rememberInfiniteTransition(label = "shimmer")
    val translateAnimation by transition.animateFloat(
        initialValue = 0f,
        targetValue = targetValue,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmer_translate"
    )

    return Brush.linearGradient(
        colors = shimmerColors,
        start = Offset.Zero,
        end = Offset(x = translateAnimation, y = translateAnimation)
    )
}

@Composable
fun ShimmerBox(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 8.dp
) {
    val brush = shimmerBrush()
    Box(
        modifier = modifier
            .clip(RoundedCornerShape(cornerRadius))
            .background(brush)
    )
}

@Composable
fun CardSkeleton(
    modifier: Modifier = Modifier,
    height: Dp = 100.dp
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                ShimmerBox(modifier = Modifier.size(40.dp), cornerRadius = 20.dp)
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    ShimmerBox(modifier = Modifier.fillMaxWidth(0.6f).height(16.dp))
                    ShimmerBox(modifier = Modifier.fillMaxWidth(0.4f).height(12.dp))
                }
            }
            Spacer(modifier = Modifier.height(4.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth().height(14.dp))
            ShimmerBox(modifier = Modifier.fillMaxWidth(0.8f).height(14.dp))
        }
    }
}

@Composable
fun ListSkeleton(
    count: Int = 4,
    modifier: Modifier = Modifier,
    itemHeight: Dp = 100.dp
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        repeat(count) {
            CardSkeleton(height = itemHeight)
        }
    }
}

@Composable
fun ProfileSkeleton(
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        ShimmerBox(modifier = Modifier.size(90.dp), cornerRadius = 45.dp)
        ShimmerBox(modifier = Modifier.width(180.dp).height(20.dp))
        ShimmerBox(modifier = Modifier.width(130.dp).height(14.dp))
        Spacer(modifier = Modifier.height(12.dp))
        CardSkeleton()
        CardSkeleton()
    }
}
