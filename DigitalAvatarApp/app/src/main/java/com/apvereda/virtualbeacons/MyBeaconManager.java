package com.apvereda.virtualbeacons;

import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.os.AsyncTask;
import android.os.RemoteException;
import android.util.Log;
import android.widget.Toast;

import org.altbeacon.beacon.Beacon;
import org.altbeacon.beacon.BeaconConsumer;
import org.altbeacon.beacon.BeaconManager;
import org.altbeacon.beacon.BeaconParser;
import org.altbeacon.beacon.RangeNotifier;
import org.altbeacon.beacon.Region;
import org.altbeacon.beacon.utils.UrlBeaconUrlCompressor;

import java.io.BufferedInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import bsh.EvalError;

public class MyBeaconManager implements BeaconConsumer {

    private BeaconManager beaconManager;
    private List<Beacon> beaconsList = new ArrayList<>();
    ReceiverActivity parentReceiverActivity;
    private Map<String, MyBeacon> beaconIntervalsMap = getBeaconsIntervalsMap();
    private Alarm myAlarm = Alarm.getInstance();


    private static MyBeaconManager instance;

    public static MyBeaconManager getInstance(){
        if(instance == null){
            instance = new MyBeaconManager();
        }
        return instance;
    }

    private MyBeaconManager(){

    }

    public MyBeacon getBeaconFromURL(String URL){
        return beaconIntervalsMap.get(URL);
    }

    public void setParentReceiverActivity(ReceiverActivity activity){
        parentReceiverActivity = activity;
    }

    public void startBeaconScan(){
        beaconManager = org.altbeacon.beacon.BeaconManager.getInstanceForApplication(parentReceiverActivity);
        // To detect proprietary beacons, you must add a line like below corresponding to your beacon
        // type.  Do a web search for "setBeaconLayout" to get the proper expression.
        beaconManager.getBeaconParsers().add(new BeaconParser().
                setBeaconLayout(BeaconParser.EDDYSTONE_URL_LAYOUT));
        beaconManager.getBeaconParsers().add(new BeaconParser().
                setBeaconLayout(BeaconParser.EDDYSTONE_UID_LAYOUT));
        beaconManager.setBackgroundMode(false);
        beaconManager.setForegroundBetweenScanPeriod(100000);
        beaconManager.setForegroundScanPeriod(1500);
        beaconManager.bind(this);

    }

    @Override
    public Context getApplicationContext() {
        return parentReceiverActivity.getApplicationContext();
    }

    @Override
    public void unbindService(ServiceConnection serviceConnection) {
        parentReceiverActivity.unbindService(serviceConnection);

    }

    @Override
    public boolean bindService(Intent intent, ServiceConnection serviceConnection, int i) {
        return parentReceiverActivity.bindService(intent, serviceConnection, i);
    }


    public void updateList(final List<Beacon> beacons) {
        this.beaconsList = beacons;
        beaconManager.setForegroundBetweenScanPeriod(100000);
        parentReceiverActivity.updateList(beaconsList);

    }

    @Override
    public void onBeaconServiceConnect() {
        beaconManager.addRangeNotifier(new RangeNotifier() {

            public void didRangeBeaconsInRegion(Collection<Beacon> beacons, Region region) {
                if (beacons.size() > 0) {
                    updateList((List<Beacon>) beacons);

                }
            }
        });

        try {
            beaconManager.startRangingBeaconsInRegion(new Region("apveredaId1", null, null, null));
        } catch (RemoteException e) {
        }
    }



    /**
     * Initiates a new scan for beacons
     */
    public void rescan() {
        beaconManager.unbind(this);
        startBeaconScan();
    }

    public void unbind(){
        beaconManager.unbind(this);
    }


    /**
     * This function is called periodically to read the beacons that are in range,
     * download their script and execute it. It reads the interval that each script
     * should be executed again so it is not constantly running the same script
     */
    public void automaticallyExecuteScriptFromBeacon(){
        /**
         * The idea is that when we update the beacons list, we add new beacons and add 1 to the
         * seen counter of old beacons. After that we iterate the updated list, subtracting 1 to the
         * seen beacon. If the seen beacon reaches 0 the beacon is considered as missing and
         * is deleted, cancelling the alarm that is downloading its script.
         */
        for(Beacon beacon: beaconsList) {

            String file_url = UrlBeaconUrlCompressor.uncompress(beacon.getId1().toByteArray());

            //if map doesn't contain this scrip, add it to the map, execute it and set interval
            if (!beaconIntervalsMap.containsKey(file_url)) {
                MyBeacon newBeacon = new MyBeacon(file_url);
                newBeacon.distance = beacon.getDistance();
                beaconIntervalsMap.put(file_url, newBeacon);

                new DownloadFileFromURL().execute(file_url);


                /**
                 * the automatic script execution is done when we read the script.
                 * after calling downloadFileFromURL().execute, the script is downloaded
                 * and stored on a file. We can read the interval from that file and add it to the
                 * corresponding MyBeacon object. This process is asynchronous, so the alarm must
                 * be set from that thread when we have set up the interval. This is done by calling
                 * startScriptInterval from MyBeaconManager (the call is made from
                 * ReceiverActivity.executeScript() method)
                 */


            }else{
                //if it is already in the map, update seen counter
                //we don't re-execute the script, since it should be managed by the Alarm class
                beaconIntervalsMap.get(file_url).seenCounter++;
                //update distance too
                beaconIntervalsMap.get(file_url).distance = beacon.getDistance();
            }

         }

        //after updating list, check all the beacons to delete the ones not found

        for(Iterator<Map.Entry<String, MyBeacon>> iterator = beaconIntervalsMap.entrySet().iterator(); iterator.hasNext();){
            Map.Entry<String, MyBeacon> entry = iterator.next();
            //get value from map, subtract 1 to the seen counter
            MyBeacon beacon = entry.getValue();
            beacon.seenCounter--;
            if(beacon.seenCounter < 1){
                //if seen counter reaches 0 remove element
                myAlarm.cancelAlarm(getApplicationContext(), beacon.getId());
                Toast.makeText(parentReceiverActivity, "Removed alarm from beacon with id: " + beacon.getId(), Toast.LENGTH_SHORT).show();
                iterator.remove();
            }
        }
    }


    private Map<String, MyBeacon> getBeaconsIntervalsMap(){
        return new HashMap<>();

    }
    /**
     * Method to obtain an instance of DownloadFileFromURL class to be used in Activities
     * @return a DownloadFileFromURL instance
     */
    public DownloadFileFromURL getDownloadFileFromURLInstance(){
        return new DownloadFileFromURL();
    }

    public void startScriptInterval(String url, String interval) {
        if(!beaconIntervalsMap.containsKey(url)){
            //If we manually select a beacon before it is added to the map, the beacon is not contained
            //in the map. Add it now.
            MyBeacon newBeacon = new MyBeacon(url);
            beaconIntervalsMap.put(url, newBeacon);
        }

        if(!beaconIntervalsMap.get(url).isActive){
            beaconIntervalsMap.get(url).isActive=true;
            beaconIntervalsMap.get(url).interval = Long.parseLong(interval);
            long intervalInMillis = Long.parseLong(interval)*60*1000; //This is the interval at which the beacon will be reescaned
            //set a 60*1000 for minutes. Less for debugging.

            //set alarm only if interval != 0. If it is 0, the script should not be executed periodically
            System.out.println("interval in millis: " +intervalInMillis);
            if(intervalInMillis != 0) {
                myAlarm.setAlarm(getApplicationContext(), intervalInMillis, url, beaconIntervalsMap.get(url).getId());
            }
        }
    }

    /**
     * Background Async Task to download file
     * */
    public class DownloadFileFromURL extends AsyncTask<String, String, String> {

        public static final int progress_bar_type = 0;

        /**
         * Before starting background thread Show Progress Bar Dialog
         */
        @Override
        protected void onPreExecute() {
            super.onPreExecute();
            if(parentReceiverActivity != null && !parentReceiverActivity.isFinishing()) {
                parentReceiverActivity.showDialog(progress_bar_type);
            }
        }

        /**
         * Downloading file in background thread
         */
        @Override
        protected String doInBackground(String... f_url) {
            int count;
            try {


                URL url = new URL(f_url[0]);

                //handle redirect
                HttpURLConnection ucon = (HttpURLConnection) url.openConnection();
                ucon.setInstanceFollowRedirects(false);
                URL secondURL = new URL(ucon.getHeaderField("Location"));
                url = secondURL;

                HttpURLConnection connection = (HttpURLConnection) url.openConnection();

                connection.connect();


                // this will be useful so that you can show a tipical 0-100%
                // progress bar
                int lengthOfFile = connection.getContentLength();

                // download the file
                InputStream input = new BufferedInputStream(url.openStream(),
                        8192);

                // Output stream
                String filePath = parentReceiverActivity.getFilesDir().getPath();
                OutputStream output = new FileOutputStream(filePath + "/beacon_script.py3");

                byte data[] = new byte[1024];

                long total = 0;

                while ((count = input.read(data)) != -1) {
                    total += count;
                    // publishing the progress....
                    // After this onProgressUpdate will be called
                    publishProgress("" + (int) ((total * 100) / lengthOfFile));

                    // writing data to file
                    output.write(data, 0, count);
                }

                // flushing output
                output.flush();

                // closing streams
                output.close();
                input.close();

            } catch (Exception e) {
                Log.e("Error: ", e.getMessage());
            }

            return f_url[0];
        }

        /**
         * Updating progress bar
         */
        protected void onProgressUpdate(String... progress) {
            // setting progress percentage
            parentReceiverActivity.pDialog.setProgress(Integer.parseInt(progress[0]));
        }

        /**
         * After completing background task Dismiss the progress dialog
         **/
        @Override
        protected void onPostExecute(String file_url) {
            // dismiss the dialog after the file was downloaded
            if(parentReceiverActivity != null &&  !parentReceiverActivity.isFinishing()) {
                parentReceiverActivity.dismissDialog(progress_bar_type);

            try {
                parentReceiverActivity.executeScript(file_url);
            } catch (EvalError evalError) {
                evalError.printStackTrace();
            }
            }


        }
    }
}
