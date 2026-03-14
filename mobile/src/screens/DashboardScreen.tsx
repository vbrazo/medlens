import React from 'react';
import {View, Text, FlatList, StyleSheet} from 'react-native';
import {useMedicationStore, ScanRecord} from '../store/medicationStore';

function AdherenceRing({rate}: {rate: number}) {
  const pct = Math.round(rate * 100);
  const color = pct >= 80 ? '#4caf50' : pct >= 60 ? '#ff9800' : '#f44336';
  return (
    <View style={[ring.box, {borderColor: color}]}>
      <Text style={[ring.value, {color}]}>{pct}%</Text>
      <Text style={ring.label}>Adherence</Text>
    </View>
  );
}

const ring = StyleSheet.create({
  box: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginVertical: 20,
  },
  value: {fontSize: 28, fontWeight: '800'},
  label: {color: '#888', fontSize: 12, marginTop: 2},
});

function ScanItem({item}: {item: ScanRecord}) {
  return (
    <View style={styles.scanItem}>
      <View style={styles.scanLeft}>
        <Text style={styles.scanName}>{item.medication}</Text>
        <Text style={styles.scanTime}>
          {new Date(item.timestamp).toLocaleString()}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          item.verified ? styles.badgeGood : styles.badgeBad,
        ]}>
        <Text style={styles.badgeText}>
          {item.verified ? 'Verified' : 'Unverified'}
        </Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const scans = useMedicationStore(s => s.scans);
  const adherenceRate = useMedicationStore(s => s.adherenceRate());

  const verifiedCount = scans.filter(s => s.verified).length;

  return (
    <View style={styles.container}>
      <FlatList
        data={scans}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({item}) => <ScanItem item={item} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AdherenceRing rate={adherenceRate} />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{scans.length}</Text>
                <Text style={styles.statLabel}>Total Scans</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, {color: '#4caf50'}]}>
                  {verifiedCount}
                </Text>
                <Text style={styles.statLabel}>Verified</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statValue, {color: '#f44336'}]}>
                  {scans.length - verifiedCount}
                </Text>
                <Text style={styles.statLabel}>Unverified</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Scan History</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              No scans yet. Start scanning medications.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0d0d0d'},
  header: {paddingHorizontal: 20},
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {color: '#fff', fontSize: 24, fontWeight: '800'},
  statLabel: {color: '#666', fontSize: 11, marginTop: 4},
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  scanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  scanLeft: {flex: 1},
  scanName: {color: '#fff', fontSize: 15, fontWeight: '600'},
  scanTime: {color: '#555', fontSize: 12, marginTop: 2},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  badgeGood: {backgroundColor: '#1a3a1a'},
  badgeBad: {backgroundColor: '#3a1a1a'},
  badgeText: {color: '#fff', fontSize: 12, fontWeight: '600'},
  empty: {padding: 40, alignItems: 'center'},
  emptyText: {color: '#444', fontSize: 14},
});
