package tech.scryme.app.di

import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import tech.scryme.app.data.repository.AuthRepositoryImpl
import tech.scryme.app.data.repository.BranchRepositoryImpl
import tech.scryme.app.data.repository.ProfileRepositoryImpl
import tech.scryme.app.data.repository.ScheduleRepositoryImpl
import tech.scryme.app.domain.repository.AuthRepository
import tech.scryme.app.domain.repository.BranchRepository
import tech.scryme.app.domain.repository.ProfileRepository
import tech.scryme.app.domain.repository.ScheduleRepository
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindScheduleRepository(
        scheduleRepositoryImpl: ScheduleRepositoryImpl
    ): ScheduleRepository

    @Binds
    @Singleton
    abstract fun bindProfileRepository(
        profileRepositoryImpl: ProfileRepositoryImpl
    ): ProfileRepository

    @Binds
    @Singleton
    abstract fun bindBranchRepository(
        branchRepositoryImpl: BranchRepositoryImpl
    ): BranchRepository
}
