package tech.scryme.app.di

import android.content.Context
import com.google.gson.Gson
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.Dispatchers
import okhttp3.OkHttpClient
import tech.scryme.app.analytics.OpenPanelTracker
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AnalyticsModule {

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return Gson()
    }

    @Provides
    @Singleton
    fun provideOpenPanelTracker(
        @ApplicationContext context: Context,
        okHttpClient: OkHttpClient,
        gson: Gson
    ): OpenPanelTracker {
        return OpenPanelTracker(
            context = context,
            okHttpClient = okHttpClient,
            gson = gson,
            ioDispatcher = Dispatchers.IO
        )
    }
}
