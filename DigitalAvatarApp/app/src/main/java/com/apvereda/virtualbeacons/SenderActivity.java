package com.apvereda.virtualbeacons;

import android.bluetooth.le.AdvertiseSettings;
import android.os.Bundle;
import com.google.android.material.snackbar.Snackbar;
import androidx.appcompat.app.AppCompatActivity;
import android.view.View;
import android.widget.Button;

import org.altbeacon.beacon.Beacon;
import org.altbeacon.beacon.BeaconParser;
import org.altbeacon.beacon.BeaconTransmitter;
import org.altbeacon.beacon.utils.UrlBeaconUrlCompressor;

import java.net.MalformedURLException;
import java.util.ArrayList;
import java.util.List;

public class SenderActivity extends AppCompatActivity {
    public BeaconTransmitter beaconTransmitter;
    Beacon beacon;
    String urlString = "https://bit.ly/2uNTMJi";//https://treasure-game-uma.herokuapp.com/script?beaconName=treasure3
  //  String urlString = "https://bit.ly/2S8FZdT";//http://192.168.1.197:3000/script?beaconName=treasure1
    /*
    * URLs of beacons
    * "https://bit.ly/2UezROD";//http://192.168.1.218:3000/script?beaconName=treasure1
    * "https://bit.ly/2S8FZdT";//http://192.168.1.197:3000/script?beaconName=treasure1
    * to be added:
    * treasure1: https://bit.ly/2UezROD
    * treasure2: https://bit.ly/2TDCCch
    * treasure3: https://bit.ly/2DtCDc1
    *
    * --HEROKU APP--
    * https://treasure-game-uma.herokuapp.com/script?beaconName=treasure1; https://bit.ly/2Ic8kdP
    * https://treasure-game-uma.herokuapp.com/script?beaconName=treasure2; https://bit.ly/2Voi9ZX
    * https://treasure-game-uma.herokuapp.com/script?beaconName=treasure3; https://bit.ly/2uNTMJi
    *
    * AC server
    * https://treasure-game-uma.herokuapp.com/acScript; https://bit.ly/34GxsS9 OLD
    * https://cosca-air-conditioning.herokuapp.com/acScript; https://bit.ly/2tpvfgA NEW
    * Local test: http://192.168.1.170:3000/acScript; https://bit.ly/3knE279
    *
    * */
    String treasureName = "";
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sender);
        try {
            byte[] buf = UrlBeaconUrlCompressor.compress(urlString);

            beacon = new Beacon.Builder()
                    .setId1(getHex(buf))
                    .setManufacturer(0xFEAA)
                    .setTxPower(-59)
                    .build();
        } catch (MalformedURLException e) {
            e.printStackTrace();
        }
        BeaconParser beaconParser = new BeaconParser()
                .setBeaconLayout(BeaconParser.EDDYSTONE_URL_LAYOUT);
        beaconTransmitter = new BeaconTransmitter(getApplicationContext(), beaconParser);
        /*
        AdvertiseSettings.ADVERTISE_MODE_BALANCED 3 Hz
        AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY 10 Hz
        AdvertiseSettings.ADVERTISE_MODE_LOW_POWER 1 Hz
         */
        beaconTransmitter.setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY);
        /*
        AdvertiseSettings.ADVERTISE_TX_POWER_HIGH -56 dBm @ 1 meter with Nexus 5
        AdvertiseSettings.ADVERTISE_TX_POWER_LOW -75 dBm @ 1 meter with Nexus 5
        AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM -66 dBm @ 1 meter with Nexus 5
        AdvertiseSettings.ADVERTISE_TX_POWER_ULTRA_LOW not detected with Nexus 5
         */
        beaconTransmitter.setAdvertiseTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM);
        Button start = (Button) findViewById(R.id.startBtn);
        start.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Starting transmission...", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
                beaconTransmitter.startAdvertising(beacon);
            }
        });
        Button stop = (Button) findViewById(R.id.stopBtn);
        stop.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                Snackbar.make(view, "Stopping transmission...", Snackbar.LENGTH_LONG)
                        .setAction("Action", null).show();
                beaconTransmitter.stopAdvertising();
            }
        });
    }

    public static List<Long> bytesToListOfLongs(byte[] bytes) {
        List<Long> longs = new ArrayList<Long>();
        for (byte b: bytes) {
            longs.add(new Long(b));
        }
        return longs;
    }

    static final String HEXES = "0123456789ABCDEF";
    public static String getHex( byte [] raw ) {
        if ( raw == null ) {
            return null;
        }
        final StringBuilder hex = new StringBuilder( 2 * raw.length );
        for ( final byte b : raw ) {
            hex.append(HEXES.charAt((b & 0xF0) >> 4))
                    .append(HEXES.charAt((b & 0x0F)));
        }
        return hex.toString();
    }
}
