package com.apvereda.virtualbeacons;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class Alarm extends BroadcastReceiver {

    static final int AUTO_BEACON_SCAN_REQUEST_CODE = 1000;
    static final int BEACON_ALARM_TRIGGER_REQUEST_CODE = 1100;

    MyBeaconManager myBeaconManager;
    private static Alarm alarmInstance;

    public static Alarm getInstance() {
        if (alarmInstance == null){
            return new Alarm();
        }else{
            return alarmInstance;
        }
    }

    public Alarm(){
        alarmInstance = this;
    }



    @Override
    public void onReceive(Context context, Intent intent){
        myBeaconManager = MyBeaconManager.getInstance();
        int requestCode = intent.getIntExtra("requestCode", 0);
        if(requestCode == BEACON_ALARM_TRIGGER_REQUEST_CODE) {
            String URL = intent.getStringExtra("URL");
            myBeaconManager.getDownloadFileFromURLInstance().execute(URL);
        }else if(requestCode == AUTO_BEACON_SCAN_REQUEST_CODE){
            myBeaconManager.automaticallyExecuteScriptFromBeacon();
        }

    }

    /**
     * Sets an alarm from current time that will trigger when timeInterval has passed
     *
     * @param context
     * @param timeInterval Time in milliseconds to trigger the alarm from now. If it is 0, it will only be called once.
     * @param URL URL to call when alarm triggers
     * @param requestCode Code to identify specific alarm. Should match id from beacon list
     */
    public void setAlarm(Context context, long timeInterval, String URL, int requestCode) {
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, Alarm.class);
        intent.putExtra("URL", URL);
        intent.putExtra("requestCode", BEACON_ALARM_TRIGGER_REQUEST_CODE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, 0);
        alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, System.currentTimeMillis(), timeInterval, pendingIntent);


    }

    /**
     * Cancels alarm specified by requestCode
     * @param context
     * @param requestCode same request code than when creating the alarm. Should match id from beacon list
     */
    public void cancelAlarm(Context context, int requestCode) {
        Intent intent = new Intent(context, Alarm.class);
        PendingIntent sender = PendingIntent.getBroadcast(context, requestCode, intent, 0);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        alarmManager.cancel(sender);
    }

    public void setAutomaticBeaconScanning(Context context, long interval){
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        Intent intent = new Intent(context, Alarm.class);
        intent.putExtra("requestCode", AUTO_BEACON_SCAN_REQUEST_CODE);
        PendingIntent pendingIntent = PendingIntent.getBroadcast(context, -1, intent, 0);
        alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, System.currentTimeMillis(), interval, pendingIntent);

    }

}

