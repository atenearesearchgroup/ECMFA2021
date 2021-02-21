package com.apvereda.virtualbeacons;

import android.app.Dialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.text.InputType;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;
import android.view.View;
import android.view.WindowManager;
import android.widget.AdapterView;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.Toast;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;

import org.altbeacon.beacon.Beacon;
import org.altbeacon.beacon.BeaconManager;
import org.altbeacon.beacon.utils.UrlBeaconUrlCompressor;

import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import bsh.EvalError;
import bsh.Interpreter;

public class ReceiverActivity extends AppCompatActivity {

    AdapterForListView adapter;
    private BeaconManager beaconManager;
    ListView beaconsListView;
    // Progress Dialog
    public ProgressDialog pDialog;
    public static final int progress_bar_type = 0;
    private MenuItem rescanMenuItem, menuChangeTemperatureItem, menuResetServerItem;
    private Menu menuList;
    private List<Beacon> beaconsList;
    private MyBeaconManager myBeaconManager;
    private Alarm myAlarm;
    private SharedPreferences settings;

    VirtualProfile myVirtualProfile;






        /**These methods are called from the beanshell interpreter
         * to be able to access and modify variables on the device
         * (the user profile)
         */
        public class InterpreterUtils{
        public void showToast(final String text, final Context context) {
            runOnUiThread(new Runnable() {
                public void run() {
                    Toast.makeText(context, text, Toast.LENGTH_LONG).show();
                }
            });
        }

        public void updateUserHints(String key, String value){

            myVirtualProfile.updateUserHints(key, value);
        }

        public void updateUserTreasures(String treasure){
            myVirtualProfile.updateUserTreasures(treasure);
        }

        public boolean checkIfTreasureAlreadyFound(String treasure){
            return myVirtualProfile.getFoundTreasures().contains(treasure);
        }

        public double getTemperature(){
            return myVirtualProfile.getComfortTemperature();
        }

        public String getUserName(){
            return myVirtualProfile.getUserName();
        }

    }
    /**
     *--------------------------------------------------------------------
     */


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_receiver);

        settings = getSharedPreferences(MainActivity.PREFS_NAME, 0);
        Bundle bundle = getIntent().getExtras();
        SharedPreferences settings = getSharedPreferences(MainActivity.PREFS_NAME, 0);

        myVirtualProfile = VirtualProfile.getVirtualProfileInstance();
        beaconsList = new ArrayList<>();


        beaconsListView = (ListView) ReceiverActivity.this.findViewById(R.id.list);
        beaconsListView.setOnItemClickListener(new AdapterView.OnItemClickListener(){
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                Beacon beacon = (Beacon) adapter.getItem(position);

                String file_url = UrlBeaconUrlCompressor.uncompress(beacon.getId1().toByteArray());
                //async task que llamará a executeScript en el onPostExecute()


                myBeaconManager.getDownloadFileFromURLInstance().execute(file_url);

            }
        });


        myBeaconManager = MyBeaconManager.getInstance();
        myBeaconManager.setParentReceiverActivity(this);

        adapter = new AdapterForListView(this);
        adapter.setData(beaconsList);
        beaconsListView.setAdapter(adapter);

        myBeaconManager.startBeaconScan();
        myAlarm = Alarm.getInstance();
        myAlarm.setAutomaticBeaconScanning(getApplicationContext(),1*60*1000);
    }


    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.menu_receiver_activity, menu);
        this.menuList = menu;
        rescanMenuItem = menu.findItem(R.id.action_restart_bluetooth_scan);
        rescanMenuItem.setVisible(true);//set to true if button is needed

        menuChangeTemperatureItem = menu.findItem(R.id.action_set_temperature);
        menuResetServerItem = menu.findItem(R.id.action_restart_server);
        toggleMenuItem();
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_restart_bluetooth_scan) {

            myBeaconManager.rescan();
            Toast.makeText(this, "Refreshing", Toast.LENGTH_SHORT).show();
            return true;

        }else if (item.getItemId() == R.id.action_settings) {
            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Enter new name");


// Set up the input
            final EditText input = new EditText(this);
// Specify the type of input expected; this, for example, sets the input as a password, and will mask the text
            input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_DATETIME_VARIATION_NORMAL);
            input.setText(myVirtualProfile.getUserName());
            input.selectAll();
            builder.setView(input);



// Set up the buttons
            builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    setUserName(input.getText().toString());

                }
            });
            builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.cancel();
                }
            });

            AlertDialog dialog = builder.create();
            dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
            dialog.show();


            return true;
        }else if(item.getItemId() == R.id.action_set_temperature){

            AlertDialog.Builder builder = new AlertDialog.Builder(this);
            builder.setTitle("Enter new temperature");


// Set up the input
            final EditText input = new EditText(this);
// Specify the type of input expected; this, for example, sets the input as a password, and will mask the text
            input.setInputType(InputType.TYPE_NUMBER_FLAG_DECIMAL);
            input.setText(Double.toString(myVirtualProfile.getComfortTemperature()));
            input.selectAll();
            builder.setView(input);

            builder.setPositiveButton("OK", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    setPreferredTemperature(input.getText().toString());

                }
            });
            builder.setNegativeButton("Cancel", new DialogInterface.OnClickListener() {
                @Override
                public void onClick(DialogInterface dialog, int which) {
                    dialog.cancel();
                }
            });

            AlertDialog dialog = builder.create();
            dialog.getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE);
            dialog.show();


            return true;


        }else if(item.getItemId() == R.id.action_restart_server){
            restartServer();
        }

        return super.onOptionsItemSelected(item);
    }


    public void executeScript(String url) throws EvalError {
        //leer fichero
        int ch;
        StringBuffer fileContent = new StringBuffer("");
        FileInputStream fis;
        try {
            fis = openFileInput("beacon_script.py3");
            try {
                while( (ch = fis.read()) != -1)
                    fileContent.append((char)ch);
            } catch (IOException e) {
                e.printStackTrace();
            }
        } catch (FileNotFoundException e) {
            e.printStackTrace();
        }

        final String data = new String(fileContent);
        int index = data.indexOf("header:interval=") + ("header:interval=".length());
        if(data.length()>2) {
            String interval = data.substring(index, index + 2);
            myBeaconManager = MyBeaconManager.getInstance();
            myBeaconManager.startScriptInterval(url, interval);
        }




        final Interpreter i = new Interpreter();
        //Set Variables

        //Interpret and execute code
        //String interpretable_code = "myapp.hello(\"David\");";
        //i.eval(interpretable_code);
        i.set("myapp", new InterpreterUtils());

        //i.set("triggerBeacon", myBeaconManager.getBeaconFromURL());
        i.set("distanceToBeacon", myBeaconManager.getBeaconFromURL(url).distance);

        /**/
        i.set("myContext", getApplicationContext());
        i.set("userName", myVirtualProfile.getUserName());
        i.set("foundTreasures", myVirtualProfile.getFoundTreasures());
        i.set("userHintsList", myVirtualProfile.getUserHints().keySet().toArray(new String[0]));
        //**/


        //i.set("userHintsList", getUserHints()) get the hints from the user profile

        Thread tempThread = new Thread(){
            public void run(){
                try {
                    i.eval(data);
                } catch (EvalError evalError) {
                    evalError.printStackTrace();
                }
            }
        };

        tempThread.start();

    };


    private void setUserName(String newUserName){
        myVirtualProfile.setUserName(newUserName);
        SharedPreferences.Editor editor = settings.edit();
        editor.putString("userName", myVirtualProfile.getUserName());
        editor.commit();
        toggleMenuItem();

    }

    private void setPreferredTemperature(String newTemperature){

        double temperature = Double.parseDouble(newTemperature);
        myVirtualProfile.setComfortTemperature(temperature);
        SharedPreferences.Editor editor = settings.edit();
        editor.putString("userTemperature", Double.toString(myVirtualProfile.getComfortTemperature()));
        editor.commit();
        toggleMenuItem();
    }

    private void restartServer(){
        myVirtualProfile.restartGameVariables();
        new CallAPI().execute(CallAPI.restartGameURL);
    }

    private void toggleMenuItem(){
        if(myVirtualProfile.getUserName().equals("root")){
            menuResetServerItem.setVisible(true);
        }else{
            menuResetServerItem.setVisible(false);
        }
    }




    @Override
    protected Dialog onCreateDialog(int id) {
        switch (id) {
            case progress_bar_type: // we set this to 0
                pDialog = new ProgressDialog(this);
                pDialog.setMessage("Downloading file. Please wait...");
                pDialog.setIndeterminate(false);
                pDialog.setMax(100);
                pDialog.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
                pDialog.setCancelable(true);

                if(!this.isFinishing()) {
                    //don't show dialog if the activity is not running
                    pDialog.show();
                }
                return pDialog;
            default:
                return null;
        }
    }


    @Override
    protected void onDestroy() {
        super.onDestroy();
        myBeaconManager.unbind();
    }

    public void updateList(final List<Beacon> beacons) {
        this.beaconsList = beacons;
        runOnUiThread(new Runnable() {
            public void run() {
                adapter.setData(beaconsList);
                beaconsListView.setAdapter(adapter);
            }
        });
    }

}
