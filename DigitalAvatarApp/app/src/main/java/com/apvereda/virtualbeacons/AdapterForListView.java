package com.apvereda.virtualbeacons;

import android.app.Activity;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import org.altbeacon.beacon.Beacon;
import org.altbeacon.beacon.utils.UrlBeaconUrlCompressor;

import java.util.List;

/**
 * Esta obra está sujeta a la licencia Reconocimiento-CompartirIgual 4.0 Internacional de
 * Creative Commons. Para ver una copia de esta licencia,
 * visite http://creativecommons.org/licenses/by-sa/4.0/.
 *
 * CareMe, creado por Alejandro Perez Vereda el 29/7/15.
 *
 * This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International
 * License. To view a copy of this license,
 * visit http://creativecommons.org/licenses/by-sa/4.0/.
 *
 * CareMe, created by Alejandro Perez Vereda on 29/7/15.
 *
 * Contact: aperezvereda@gmail.com
 */

public class AdapterForListView extends BaseAdapter {
	Activity context;
	List<Beacon> data;

	public AdapterForListView(Activity context) {
		super();
		this.context = context;
	}

	public void setData(List<Beacon> data) {
		this.data = data;
	}

	public View getView(int position, View convertView, ViewGroup parent) {
		LayoutInflater inflater = (LayoutInflater) context
				.getSystemService(Context.LAYOUT_INFLATER_SERVICE);
		convertView = inflater.inflate(R.layout.listitem, null);

		TextView lblAddress = (TextView) convertView.findViewById(R.id.lbladdress);
		byte[] decodedurl = data.get(position).getId1().toByteArray();
		if(decodedurl.length >0) {
			lblAddress.setText(UrlBeaconUrlCompressor.uncompress(decodedurl));
		}else{
			lblAddress.setText(data.get(position).getId1().toString());
		}
		lblAddress.setText(data.get(position).getBluetoothName());


		return (convertView);
	}

	@Override
	public int getCount() {
		// TODO Auto-generated method stub
		return data.size();
	}

	@Override
	public Object getItem(int position) {
		// TODO Auto-generated method stub
		return data.get(position);
	}

	@Override
	public long getItemId(int position) {
		// TODO Auto-generated method stub
		return position;
	}


}
