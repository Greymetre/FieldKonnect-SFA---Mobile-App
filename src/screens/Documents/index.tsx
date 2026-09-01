import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Pdf from 'react-native-pdf';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Svg, { Path } from 'react-native-svg';
import { getProductCatalogueDocumentsApi } from '../../api/query/DocumentApi';
import { resolveMediaUrl } from '../../api/AxiosClient';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';

const readableSize = (bytes: any) => {
  const size = Number(bytes || 0);
  if (!size) return 'PDF document';
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const safeFileName = (value: any, index: number) => {
  const name = String(value || `Product_Catalogue_${index + 1}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_');
  return name.toLowerCase().endsWith('.pdf') ? name : `${name}.pdf`;
};

const Documents = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [downloadingId, setDownloadingId] = useState<any>(null);
  const [pdfLoading, setPdfLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    try {
      setError('');
      const response = await getProductCatalogueDocumentsApi();
      const media = response?.data?.data?.media || [];
      const catalogues = media.filter((item: any) => !item?.collection_name || item.collection_name === 'product_catalogue').map((item: any, index: number) => ({
        ...item,
        id: item.id ?? index,
        title: String(item.name || item.file_name || `Product Catalogue ${index + 1}`).replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '),
        fileName: safeFileName(item.file_name || item.name, index),
        url: resolveMediaUrl(item.original_url || item.url || item.full_url || item.file_path),
      })).filter((item: any) => item.url);
      setDocuments(catalogues);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || 'Unable to load documents. Please try again.');
      setDocuments([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); loadDocuments(); }, [loadDocuments]));

  const downloadDocument = async (document: any) => {
    try {
      setDownloadingId(document.id);
      const directory = Platform.OS === 'android' ? ReactNativeBlobUtil.fs.dirs.DownloadDir : ReactNativeBlobUtil.fs.dirs.DocumentDir;
      const destination = `${directory}/${document.fileName}`;
      const config = Platform.OS === 'android' ? {
        fileCache: true,
        path: destination,
        addAndroidDownloads: { useDownloadManager: true, notification: true, title: document.fileName, description: 'Product catalogue', mime: 'application/pdf', path: destination, mediaScannable: true },
      } : { fileCache: true, path: destination };
      await ReactNativeBlobUtil.config(config).fetch('GET', document.url);
      if (Platform.OS === 'ios') await ReactNativeBlobUtil.ios.openDocument(destination);
      else Alert.alert('Download Complete', `${document.fileName} was saved to Downloads.`);
    } catch (requestError: any) {
      Alert.alert('Download Failed', requestError?.message || 'Unable to download this document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const subtitle = useMemo(() => `${documents.length} ${documents.length === 1 ? 'document' : 'documents'} available`, [documents.length]);

  return <View style={styles.container}>
    <View style={styles.hero}><View style={styles.heroIcon}><DocumentIcon type="document" color="white" size={28} /></View><View style={{ flex: 1 }}><AppText size={19} color="white" family="InterBold">Product Catalogue</AppText><AppText size={12} color="#DCE4FF" family="InterRegular">{loading ? 'Loading catalogue documents...' : subtitle}</AppText></View></View>
    {loading ? <View style={styles.state}><ActivityIndicator size="large" color={colors.blue} /><AppText size={13} color="#747D90" family="InterMedium">Loading documents...</AppText></View> : error ? <View style={styles.state}><View style={styles.stateIcon}><DocumentIcon type="document" size={28} /></View><AppText size={15} color="#30384A" family="InterBold">Documents unavailable</AppText><AppText size={13} color="#858DA0" family="InterRegular" align="center">{error}</AppText><Pressable style={styles.retry} onPress={() => { setLoading(true); loadDocuments(); }}><AppText size={13} color="white" family="InterBold">Try Again</AppText></Pressable></View> : <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.blue} onRefresh={() => { setRefreshing(true); loadDocuments(); }} />}>
      {documents.length ? documents.map((document, index) => <View key={document.id} style={styles.card}><View style={styles.pdfIcon}><AppText size={11} color="white" family="InterBold">PDF</AppText></View><View style={styles.cardInfo}><AppText size={16} color="#202432" family="InterBold" numLines={2}>{document.title}</AppText><AppText size={12} color="#858DA0" family="InterRegular" style={{ marginTop: 4 }}>{readableSize(document.size)} · Product catalogue</AppText></View><View style={styles.actions}><Pressable style={styles.viewButton} onPress={() => { setPdfLoading(true); setSelectedDocument(document); }}><DocumentIcon type="view" size={18} /><AppText size={12} color={colors.blue} family="InterBold">View</AppText></Pressable><Pressable style={styles.downloadButton} disabled={downloadingId === document.id} onPress={() => downloadDocument(document)}>{downloadingId === document.id ? <ActivityIndicator size="small" color="white" /> : <DocumentIcon type="download" color="white" size={18} />}<AppText size={12} color="white" family="InterBold">{downloadingId === document.id ? 'Saving' : 'Download'}</AppText></Pressable></View></View>) : <View style={styles.state}><View style={styles.stateIcon}><DocumentIcon type="document" size={28} /></View><AppText size={16} color="#30384A" family="InterBold">No documents uploaded</AppText><AppText size={13} color="#858DA0" family="InterRegular" align="center">Product catalogue PDFs uploaded from CRM settings will appear here.</AppText></View>}
    </ScrollView>}

    <Modal visible={Boolean(selectedDocument)} animationType="slide" onRequestClose={() => setSelectedDocument(null)}>
      <View style={styles.viewer}><View style={styles.viewerHeader}><Pressable style={styles.viewerClose} onPress={() => setSelectedDocument(null)}><DocumentIcon type="close" size={20} /></Pressable><View style={{ flex: 1 }}><AppText size={16} color="#202432" family="InterBold" numLines={1}>{selectedDocument?.title}</AppText><AppText size={11} color="#858DA0" family="InterRegular">PDF Preview</AppText></View><Pressable style={styles.viewerDownload} onPress={() => downloadDocument(selectedDocument)}><DocumentIcon type="download" color="white" size={19} /></Pressable></View><View style={styles.pdfWrap}>{pdfLoading && <ActivityIndicator size="large" color={colors.blue} style={styles.pdfLoader} />}{selectedDocument?.url ? <Pdf source={{ uri: selectedDocument.url, cache: true }} style={styles.pdf} trustAllCerts={false} onLoadComplete={() => setPdfLoading(false)} onError={(pdfError: any) => { setPdfLoading(false); Alert.alert('Preview Unavailable', pdfError?.message || 'Unable to open this PDF.'); }} /> : null}</View></View>
    </Modal>
  </View>;
};

const DocumentIcon = ({ type, size = 20, color = colors.blue }: any) => { const line = { stroke: color, strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }; const icons: Record<string, React.ReactNode> = { document: <><Path d="M5 3h10l4 4v14H5V3z" {...line} /><Path d="M15 3v5h4M8 12h8m-8 4h8" {...line} /></>, view: <><Path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z" {...line} /><Path d="M12 9a3 3 0 110 6 3 3 0 010-6z" {...line} /></>, download: <><Path d="M12 3v12m-4-4l4 4 4-4M4 19h16" {...line} /></>, close: <Path d="M6 6l12 12M18 6L6 18" {...line} /> }; return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">{icons[type]}</Svg>; };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6FA' }, hero: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 13, margin: 16, marginBottom: 4, padding: 16, borderRadius: 18, backgroundColor: colors.blue, elevation: 4, shadowColor: colors.blue, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 9 }, heroIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)' }, content: { padding: 16, paddingBottom: 36 }, card: { marginBottom: 13, padding: 15, borderRadius: 18, backgroundColor: 'white', borderWidth: 1, borderColor: '#E4E8EF', elevation: 3, shadowColor: '#17203A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8 }, pdfIcon: { width: 48, height: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.blue }, cardInfo: { position: 'absolute', left: 76, right: 15, top: 17, minHeight: 52 }, actions: { flexDirection: 'row', gap: 10, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E9ECF2' }, viewButton: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: colors.blue + '0D', borderWidth: 1, borderColor: colors.blue + '30' }, downloadButton: { flex: 1.25, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 12, backgroundColor: colors.blue }, state: { flex: 1, minHeight: 260, padding: 30, alignItems: 'center', justifyContent: 'center', gap: 9 }, stateIcon: { width: 66, height: 66, marginBottom: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.blue + '0D' }, retry: { marginTop: 5, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 11, backgroundColor: colors.blue }, viewer: { flex: 1, backgroundColor: '#E9ECF2' }, viewerHeader: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: Platform.OS === 'ios' ? 44 : 12, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#DFE3EA' }, viewerClose: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue + '0D' }, viewerDownload: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue }, pdfWrap: { flex: 1 }, pdf: { flex: 1, width: '100%' }, pdfLoader: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
});

export default Documents;
