package expo.modules.playupdates

import android.app.Activity
import android.content.Context
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * Google Play In-App Updates. Play knows when a newer version of the app is published on the
 * track this user installs from, so there is nothing to bump on our side per release. It only
 * answers for installs that came from Google Play; sideloaded and debug builds get an error.
 */
class PlayUpdatesModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val manager: AppUpdateManager by lazy { AppUpdateManagerFactory.create(context) }

  private val immediate = AppUpdateOptions.defaultOptions(AppUpdateType.IMMEDIATE)

  override fun definition() = ModuleDefinition {
    Name("PlayUpdates")

    AsyncFunction("checkForUpdate") { promise: Promise ->
      manager.appUpdateInfo
        .addOnSuccessListener { info ->
          promise.resolve(
            mapOf(
              "status" to status(info),
              "availableVersionCode" to info.availableVersionCode(),
              "stalenessDays" to info.clientVersionStalenessDays(),
              "priority" to info.updatePriority(),
            )
          )
        }
        .addOnFailureListener { e -> promise.reject(checkFailed(e)) }
    }

    // Opens Play's full-screen update, which downloads, installs and restarts the app. Resolves
    // "canceled" if the user backs out, "failed" if Play can't run it.
    AsyncFunction("startUpdate") { promise: Promise ->
      val activity = appContext.currentActivity ?: throw Exceptions.MissingActivity()
      // An AppUpdateInfo can start only one flow, so fetch a fresh one each time.
      manager.appUpdateInfo
        .addOnSuccessListener { info ->
          if (status(info) == "none") {
            promise.resolve("unavailable")
            return@addOnSuccessListener
          }
          manager.startUpdateFlow(info, activity, immediate)
            .addOnSuccessListener { code ->
              promise.resolve(
                when (code) {
                  Activity.RESULT_OK -> "ok"
                  Activity.RESULT_CANCELED -> "canceled"
                  else -> "failed"
                }
              )
            }
            .addOnFailureListener { e ->
              promise.reject(CodedException("ERR_UPDATE_FLOW", e.message ?: "Couldn't start the update", e))
            }
        }
        .addOnFailureListener { e -> promise.reject(checkFailed(e)) }
    }
  }

  /** "available" and "in-progress" (an update the user already started) can both be started. */
  private fun status(info: AppUpdateInfo) =
    when (info.updateAvailability()) {
      UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS -> "in-progress"
      UpdateAvailability.UPDATE_AVAILABLE ->
        if (info.isUpdateTypeAllowed(immediate)) "available" else "none"
      else -> "none"
    }

  private fun checkFailed(e: Exception) =
    CodedException("ERR_UPDATE_CHECK", e.message ?: "Couldn't check for updates", e)
}
