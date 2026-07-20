import pandas as pd

df = pd.read_csv('synthetic_flood_dataset_real_stations.csv')
unique_stations = df.drop_duplicates(subset=['stationName']).to_dict('records')

existing_stations = ['Norwood', 'Kithulgala', 'Deraniyagala', 'Glencourse', 'Hanwella', 'Nagalagam Street', 'Ratnapura', 'Millakanda', 'Ellagawa', 'Putupaula', 'Pitabeddara', 'Thalgahagoda', 'Baddegama', 'Tawalama', 'Holombuwa', 'Giriulla', 'Peradeniya', 'Manampitiya', 'Welikanda', 'Thanamalwila', 'Uva Paranagama', 'Dambulla', 'Mediyawa', 'Padiyathalawa', 'Angammedilla']

missing = [s for s in unique_stations if s['stationName'] not in existing_stations]

code_lines = []
for s in missing:
    station_name = s['stationName']
    river = s['riverName']
    river_slug = river.split(' ')[0].upper()
    name_slug = station_name.replace(' ', '').upper()
    s_id = f'RG-{river_slug}-{name_slug}'
    alert = s.get('watch_threshold_m', 4.0)
    minor = s.get('warning_threshold_m', 5.5)
    major = s.get('critical_threshold_m', 7.0)
    normal = alert / 2
    code = f"    {{ id: '{s_id}', river: '{river}', name: '{station_name}', district: 'Unknown', lat: 7.0, lng: 80.0, normal: {normal}, alert: {alert}, minor: {minor}, major: {major} }},"
    code_lines.append(code)

with open('scratch/missing_stations.txt', 'w') as f:
    f.write('\n'.join(code_lines))
