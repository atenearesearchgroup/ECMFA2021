package com.apvereda.virtualbeacons;

import android.os.AsyncTask;

import java.io.BufferedInputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class CallAPI extends AsyncTask<String, String, String> {

    public static final String restartGameURL = "https://treasure-game-uma.herokuapp.com/restartGame";


    public CallAPI(){
        //set context variables if required
    }

    @Override
    protected void onPreExecute() {
        super.onPreExecute();
    }

    @Override
    protected String doInBackground(String... params) {
        String urlString = params[0]; // URL to call
        //String data = params[1]; //data to post
        OutputStream out = null;

        try {
            URL url = new URL(urlString);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            /*out = new BufferedOutputStream(urlConnection.getOutputStream());


            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(out, "UTF-8"));
          //  writer.write(data);
            writer.flush();
            writer.close();
            out.close();
            */

            InputStream input = new BufferedInputStream(url.openStream(),
                    8192);
            urlConnection.connect();

        } catch (Exception e) {
            System.out.println(e.getMessage());
        }

        return null;
    }
}