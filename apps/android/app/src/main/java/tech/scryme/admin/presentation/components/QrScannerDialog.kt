package tech.scryme.admin.presentation.components

import android.Manifest
import android.content.pm.PackageManager
import android.view.ViewGroup
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material.icons.filled.VpnKey
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import com.google.zxing.*
import com.google.zxing.common.HybridBinarizer
import java.util.concurrent.Executors

// ---------------------------------------------------------------------------
// Shared palette — keep in sync with LoginScreen.kt. Move to a Theme.kt /
// Color.kt file if you want a single source of truth across screens.
// ---------------------------------------------------------------------------
private val SmokyTop = Color(0xFF0D1117)
private val SmokyMid = Color(0xFF161B22)
private val CardSurface = Color(0xFF171C24)
private val CardBorder = Color(0xFF2A313D)
private val FieldSurface = Color(0xFF10141B)
private val AccentBlue = Color(0xFF3B82F6)
private val AccentBlueDim = Color(0xFF2563EB)
private val TextPrimary = Color(0xFFF3F5F7)
private val TextSecondary = Color(0xFF8B95A5)
private val ErrorRed = Color(0xFFEF4444)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun QrScannerDialog(
    onDismissRequest: () -> Unit,
    onQrCodeScanned: (String) -> Unit
) {
    val context = LocalContext.current
    var hasCameraPermission by remember {
        mutableStateOf(
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.CAMERA
            ) == PackageManager.PERMISSION_GRANTED
        )
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        hasCameraPermission = granted
    }

    LaunchedEffect(Unit) {
        if (!hasCameraPermission) {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    var manualToken by remember { mutableStateOf("") }

    Dialog(
        onDismissRequest = onDismissRequest,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Surface(
            modifier = Modifier
                .fillMaxWidth(0.94f)
                .wrapContentHeight(),
            shape = RoundedCornerShape(24.dp),
            color = CardSurface,
            border = BorderStroke(1.dp, CardBorder),
            shadowElevation = 24.dp,
            tonalElevation = 0.dp
        ) {
            Column(
                modifier = Modifier
                    .background(
                        Brush.verticalGradient(
                            colors = listOf(SmokyMid, SmokyTop)
                        )
                    )
                    .padding(24.dp)
                    .fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(
                                    Brush.linearGradient(listOf(AccentBlueDim, AccentBlue))
                                ),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.QrCodeScanner,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(
                                text = "Scan POS QR Code",
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.SemiBold),
                                color = TextPrimary
                            )
                            Text(
                                text = "Link a terminal to this account",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                    }
                    IconButton(onClick = onDismissRequest) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = TextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(20.dp))

                if (hasCameraPermission) {
                    Box(
                        modifier = Modifier
                            .size(260.dp)
                            .clip(RoundedCornerShape(16.dp))
                            .background(Color.Black)
                            .border(1.dp, CardBorder, RoundedCornerShape(16.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        CameraXScannerView(
                            onQrCodeScanned = { qr ->
                                onQrCodeScanned(qr)
                            }
                        )
                        ScannerFrameOverlay()
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                    Text(
                        text = "Point the camera at the QR code shown on the POS terminal",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary,
                        textAlign = TextAlign.Center
                    )
                } else {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(14.dp))
                            .background(ErrorRed.copy(alpha = 0.10f))
                            .padding(16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.ErrorOutline,
                            contentDescription = null,
                            tint = ErrorRed,
                            modifier = Modifier.size(22.dp)
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Camera permission is required to scan QR codes.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = ErrorRed,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = { permissionLauncher.launch(Manifest.permission.CAMERA) },
                            shape = RoundedCornerShape(10.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = AccentBlue)
                        ) {
                            Text("Grant Camera Permission", color = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))
                HorizontalDivider(color = CardBorder)
                Spacer(modifier = Modifier.height(20.dp))

                Row(
                    modifier = Modifier.align(Alignment.Start),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.VpnKey,
                        contentDescription = null,
                        tint = TextSecondary,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "Or enter setup token manually",
                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.SemiBold),
                        color = TextSecondary
                    )
                }
                Spacer(modifier = Modifier.height(10.dp))

                OutlinedTextField(
                    value = manualToken,
                    onValueChange = { manualToken = it },
                    placeholder = { Text("Setup Token", color = TextSecondary.copy(alpha = 0.6f)) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AccentBlue,
                        unfocusedBorderColor = CardBorder,
                        focusedContainerColor = FieldSurface,
                        unfocusedContainerColor = FieldSurface,
                        cursorColor = AccentBlue,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = {
                        if (manualToken.isNotBlank()) {
                            onQrCodeScanned(manualToken.trim())
                        }
                    },
                    enabled = manualToken.isNotBlank(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = AccentBlue,
                        disabledContainerColor = AccentBlue.copy(alpha = 0.35f)
                    ),
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    Text(
                        text = "Authorize POS Terminal",
                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.SemiBold),
                        color = Color.White
                    )
                }
            }
        }
    }
}

/**
 * Purely decorative corner-bracket overlay drawn on top of the camera preview,
 * giving the scan area a deliberate "targeting" look instead of a bare square.
 */
@Composable
private fun ScannerFrameOverlay() {
    val bracketColor = AccentBlue
    val bracketLength = 24.dp
    val bracketThickness = 3.dp
    val inset = 10.dp

    Box(modifier = Modifier.fillMaxSize()) {
        // Top-left
        Box(
            Modifier
                .align(Alignment.TopStart)
                .padding(inset)
                .size(width = bracketLength, height = bracketThickness)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        Box(
            Modifier
                .align(Alignment.TopStart)
                .padding(inset)
                .size(width = bracketThickness, height = bracketLength)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        // Top-right
        Box(
            Modifier
                .align(Alignment.TopEnd)
                .padding(inset)
                .size(width = bracketLength, height = bracketThickness)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        Box(
            Modifier
                .align(Alignment.TopEnd)
                .padding(inset)
                .size(width = bracketThickness, height = bracketLength)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        // Bottom-left
        Box(
            Modifier
                .align(Alignment.BottomStart)
                .padding(inset)
                .size(width = bracketLength, height = bracketThickness)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        Box(
            Modifier
                .align(Alignment.BottomStart)
                .padding(inset)
                .size(width = bracketThickness, height = bracketLength)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        // Bottom-right
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .padding(inset)
                .size(width = bracketLength, height = bracketThickness)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
        Box(
            Modifier
                .align(Alignment.BottomEnd)
                .padding(inset)
                .size(width = bracketThickness, height = bracketLength)
                .background(bracketColor, RoundedCornerShape(2.dp))
        )
    }
}

@Composable
fun CameraXScannerView(
    onQrCodeScanned: (String) -> Unit
) {
    val lifecycleOwner = LocalLifecycleOwner.current
    var hasScanned by remember { mutableStateOf(false) }

    AndroidView(
        factory = { ctx ->
            val previewView = PreviewView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
            }

            val cameraProviderFuture = ProcessCameraProvider.getInstance(ctx)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()

                val cameraExecutor = Executors.newSingleThreadExecutor()

                val reader = MultiFormatReader().apply {
                    setHints(mapOf(DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE)))
                }

                imageAnalysis.setAnalyzer(cameraExecutor) { imageProxy ->
                    if (!hasScanned) {
                        val buffer = imageProxy.planes[0].buffer
                        val data = ByteArray(buffer.remaining())
                        buffer.get(data)
                        val source = PlanarYUVLuminanceSource(
                            data, imageProxy.width, imageProxy.height,
                            0, 0, imageProxy.width, imageProxy.height, false
                        )
                        val binaryBitmap = BinaryBitmap(HybridBinarizer(source))
                        try {
                            val result = reader.decode(binaryBitmap)
                            val text = result.text
                            if (!text.isNullOrBlank() && !hasScanned) {
                                hasScanned = true
                                onQrCodeScanned(text)
                            }
                        } catch (_: NotFoundException) {
                            // Frame doesn't contain QR code
                        } catch (e: Exception) {
                            // Decode exception
                        }
                    }
                    imageProxy.close()
                }

                try {
                    cameraProvider.unbindAll()
                    cameraProvider.bindToLifecycle(
                        lifecycleOwner,
                        cameraSelector,
                        preview,
                        imageAnalysis
                    )
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }, ContextCompat.getMainExecutor(ctx))

            previewView
        },
        modifier = Modifier.fillMaxSize()
    )
}
