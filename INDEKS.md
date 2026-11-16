# INDEKS FUNGSI (dijana automatik — jangan edit tangan)
Jana semula: `python3 tools/jana_indeks.py`. Rujuk `STRUKTUR.md` untuk gambaran keseluruhan.

## js/01-config-dispatcher.js — 441 baris, 21 KB
**Fungsi:** _mapProgramOut:21, _mapPenyertaanOut:40, _mapPencapaianOut:64, _mapSekolahOut:85, _mapAkaunOut:89, _rowArrToPenyertaanIn:104, _throwIfErr:124, _fetchAllPaged:133, _supaDispatch:148, _uniq:440
**Pemboleh ubah:** SUPABASE_URL:4, SUPABASE_ANON_KEY:5, sb:6, TBL_PROGRAM:14, TBL_PENYERTAAN:15, TBL_PENCAPAIAN:16, TBL_PENGGUNA:17, TBL_SEKOLAH:18

## js/02-core.js — 406 baris, 18 KB
**Fungsi:** _initRealtimeSync:33, esc:91, hlMatch:93, getTPT:111, _normPeringkat:121, mPts:132, cGet:150, cSet:151, cBust:152, onTahunChange:155, initTahunSel:164, run:198, showOv:251, hideOv:252, setBtn:253, _isPenyFormAktif:258, _tunjukDialogTinggal:273, _doShowPage:294, showPage:313, _resetTabFilters:324, togMarkah:356, buildMarkahGrid:362, askConfirm:375, askPin:386, doPin:394
**Pemboleh ubah:** _realtimeBustTimer:30, _realtimeQueue:31, LOGO_URL:78, LOGO_FULL:79, selId:80, _salinanPayload:81, gCnt:82, eId:83, _pps:84, pAct:85, _rk:86, _aP:87, _selTahun:88, MARKAH:100, PER_ORDER:108, TPT_STANDARD:109, TPT_TERBUKA:110, DAYS:112, MTHS:113, PERINGKAT_ALIAS:116, _peringkatWarnings:120, _C:149, RFN:188, _WRITE_FNS:191

## js/03-program-senarai.js — 639 baris, 29 KB
**Fungsi:** getKatChecked:2, handleKatCheck:6, daftarProgram:22, clearPF:41, loadProgs:51, populateMonthFilt:100, _setStab:121, _updateStabCounts:129, applyProgFilt:140, clearProgFilt:159, renderProgList:165, progCard:214, tutupRow:301, reqLihat:337, lihatPeny:341, reqPadamSek:437, padamSekPeny:450, _editSekolahDariBullet:465, reqEditSek:480, _openPenyertaanEdit:501, _prefillPenyertaanEdit:554, reqEdit:590, openEdit:600, onEKat:638
**Pemboleh ubah:** _activeStab:120

## js/04-program-edit-pencapaian.js — 532 baris, 29 KB
**Fungsi:** _onEditChange:3, saveEdit:19, renderPcForm:88, _autoFillBrkKsl:362, _fillBrkFromScores:495
**Pemboleh ubah:** _editSaved:2, _brkPesList:361

## js/05-pencapaian-rumusan.js — 549 baris, 27 KB
**Fungsi:** _chkdBuild:2, _chkdRenderList:48, _chkdFilter:70, _chkdToggle:74, _chkdUpdateTags:107, _chkdGetSel:135, _chkdGetNorm:140, rPGKat:146, updateMarkah:165, _collectPencEntries:182, savePenc:235, _buildPencConfirm:241, doSavePenc:341, reqPadam:387, padamProg:392, reqRum:399, doRumusan:404, buildRum:421

## js/06-print-export.js — 753 baris, 52 KB
**Fungsi:** buildPrintPortal:3, rpDBox:416, rpBJ:422, dBox:444, dBoxBangsaJantina:449, dBoxBJ:478, printRum:504, _numTeks:514, _csvCell:523, _xlTeksSheets:530, _xlTeksLajur:540, _kpSel:550, expCSV:554, reqXlsx:591, expXlsx:596, _buildXlsxWorkbook:620

## js/07-penyertaan-draf.js — 579 baris, 29 KB
**Fungsi:** _penyAutoSave:9, _startPenyAutoSave:21, _stopPenyAutoSave:25, _checkPenyDraft:30, _draftSambung:60, _draftReset:64, _draftBuang:71, _restorePenyDraft:77, loadProgsForPeny:106, setPenyView:141, applyPenyFilt:151, renderPenyList:167, pilihProg:232, _lihatSekolahDlmProgram:307, _buildKatLegend:347, addMainGuru:357, removeMainGuru:365, _getGuruSyorFromAP:370, _getPesSyorFromAP:388, renderMainGuruList:410, pickGuruFromSyor:450, _fmtTel60:463, fmtTel:480, normTel:487, telDisplay:499, fmtKP:508, normKP:530, saveGuru:537, addMainPes:546, _autoAssignKatByJantina:555, removeMainPes:575
**Pemboleh ubah:** _progForPny:5, _penyAutoSaveTimer:8, _penyView:139, _syorGuruCache:407, _syorPesCache:408

## js/08-penyertaan-bulk.js — 480 baris, 23 KB
**Fungsi:** muatTurunTemplatXlsx:2, onXlsxFileSelected:41, _prosesBulkXlsx:58, renderMainPesList:140, pickPesFromSyor:190, savePes:202, saveKatPes:210, bangOpt:237, janOpt:241, semakPeny:246, _syncFormValues:384, hantarPeny:419

## js/09-penyertaan-pdf.js — 588 baris, 26 KB
**Fungsi:** janaPdfSalinanPenyertaan:2, buildSalinanPortal:247, cetakSalinan:403, muatTurunSalinan:433, _syncBatalBtn:443, batalKemaskiniPeny:449, resetPeny:459, onKodIn:480, _showPenyForm:539, _prefillFromExisting:552

## js/10-dashboard.js — 719 baris, 36 KB
**Fungsi:** printDashRingkasan:4, _togDashSection:50, _updateDashTimestamp:59, loadDash:66, _tempatRank:98, _pelibatanDedupKey:120, getSkor:124, _hasPenc:264, _pencBadge:270, _isSekType:276, buildRank:277, moreRank:304, showDet:337, buildPenc:405, renderPencNameList:423, showPencDet:438, buildPodium:445, renderPencGrp:556, morePenc:586, uniByProg:604, uniSek:609, openBarList:620, renderBarList:631, filterBarList:641, clearBarListSrch:650, buildBar:654, renderBar:660, filtTable:679, renderTable:685, tableNav:686, _renderTablePage:691
**Pemboleh ubah:** PELIBATAN_DEDUP_SCOPE:111, LUAR_POLISI:117, LUAR_FAKTOR_PELIBATAN:118, _dashJenis:119, _barData:614, _barListData:619, _tbData:684

## js/11-modal-carian.js — 446 baris, 26 KB
**Fungsi:** openMo:7, closeMo:28, _openDynMo:45, _closeDynMo:52, gv:63, ej:64, cntBy:65, uniqGuru:66, uniqPes:67, fd:68, _trackAccess:69, _fmtAccess:84, toast:91, toggleReveal:100, openSrchDetProg:115, buildSdetPrint:179, printSdet:367, filterMore:378, clearMoreSrch:407, filterMorep:417, clearMorepSrch:441
**Pemboleh ubah:** _zTop:2, _moOpenCount:5, _moFocusStack:6, _srchTimer:99, _moreData:376, _morepBp:414, _morepKeys:415

## js/12-sekolah.js — 401 baris, 19 KB
**Fungsi:** loadSekolahMaster:65, _buildSekKodMap:84, _jenisSekolah:91, _filterSkorByJenis:101, _renderRkType:118, _setRkJenis:125, onSugSekPeny:136, pickSekPeny:153, _syncDafSekDisplay:161, onSekSelect:170, _getSekSuggestions:222, _getNamaSekolahByKod:246, _tambahSekExtra:258, onSugKod:268, pickSugKod:286, onSugSek:295, pickSugSek:313, hideSug:322, onSugKodProg:330, onSugPengelolaProg:347, pickSugProg:364, onSugDafSek:373, pickDafSek:390, _populateDafSekDropdown:399, onDafSekSelect:400
**Pemboleh ubah:** _SEKOLAH_STATIK:2, _sekExtraDb:55, _sekolahMasterLoaded:64, _sekKodMap:83, _rkJenisFilter:110, _rkFull:111, _rkElMap:112

## js/13-dashboard-filter.js — 222 baris, 9 KB
**Fungsi:** setDashBidang:6, filterByBidang:18, filterPnyByBidang:30, filterPncByBidang:47, rebuildDash:63, buildSekTiadaRekod:156
**Pemboleh ubah:** _dashBidang:2, BIDANG_SUKAN:3, BIDANG_KOKU:4

## js/14-auth-login.js — 464 baris, 19 KB
**Fungsi:** lgTab:6, lgClearMsg:16, lgMsg:23, lgToggleAdmin:28, lgDot:45, lgResetStep:50, lgCariAkaun:60, lgMasuk:135, _mulakanSesi:162, _pfNamaVal:233, _pfMaskKP:234, openProfil:235, _pfOnChange:254, simpanProfil:259, _refreshNavUser:281, _applyRoleUI:294, lgKeluarConfirm:321, lgKeluar:333, lgDaftar:410
**Pemboleh ubah:** _sesi:3, _pfAsal:232

## js/15-akaun-admin.js — 522 baris, 27 KB
**Fungsi:** loadAkaun:9, akFilt:23, akFiltRole:33, akFiltSek:39, _populateAkFiltSek:45, akCari:69, akCariClear:75, akToggleGroup:82, _akaunCardHtml:93, renderAkaun:129, _akKemaskini:183, akResetPin:193, akConfirmReset:224, akEditMaklumat:266, onSugEdmSek:300, akSimpanMaklumat:323, bukaSenaraiSekolah:360, _muatSenaraiSekolah:395, sekSeedAwal:408, sekCari:423, _renderSenaraiSekolah:425, sekMulaTambah:448, sekSimpanTambah:455, sekMulaEdit:477, sekSimpanEdit:489, akLulus:508, akNyahaktif:514, akAktifSemula:515, akTukarRole:516
**Pemboleh ubah:** _akaunData:2, _akaunFilt:3, _akaunRoleFilt:4, _akaunSekFilt:5, _akaunSearchQ:6, _akaunGroupBySek:7, _sekolahList:357, _sekolahCariQ:358

## js/16-akses-sesi-idle-google.js — 382 baris, 17 KB
**Fungsi:** _checkPenyAkses:2, canPadamSek:12, showPcErr:28, hidePcErr:36, _progKatList:41, _getKatAsing:45, _checkKatMismatch:57, _initSesiDariStorage:73, _patchPadamSekBtns:98, loginGoogle:177, _initGoogleAuth:221, _semakSesiGoogle:234, claimAkaunGoogle:275, _toggleClaimMod:293, onSugClaimSek:306, pickClaimSek:323, daftarAkaunGoogleBaru:331, _initApp:353
**Pemboleh ubah:** _SESI_TTL_MS:72, _origSemakPeny:94, _gSemakBusy:233

## js/17-dashboard-analitik-fullscreen.js — 853 baris, 37 KB
**Fungsi:** bnavSet:2, patchBnavAkaun:11, animateCounter:20, setView:45, openFullscreen:77, closeFullscreen:108, fsStatKad:131, fsProgSenarai:151, fsDashboard:158, _addFsButtonsToStatKad:170, _updateSekolahFilter:225, setStatusPill:242, applyDashFilters:252, resetDashFilters:284, _dfFilterProgs:324, _dfFilterPny:359, _dfFilterPnc:380, _withJenis:392, buildPanelLuar:393, buildChartBidang:448, buildChartDonut:476, buildChartTrend:519, buildChartJantina:591, buildProgTable:656, fsChart:702, fsProgTable:716, toggleNativeFullscreen:728, _onFsChange:783
**Pemboleh ubah:** _fsActive:74, _fsPrevFocus:75, _origLoadDash:193, _origMulakanSesi:205, _dashStatus:219, _dashPeringkat:220, _dashBulan:221, _dashSekolah:222, BIDANG_KOKU_LIST:322, _nativeFsElId:726

## js/18-ai-fab.js — 192 baris, 7 KB
**Fungsi:** aiTogglePanel:20, aiRenderSugg:38, aiOnKeydown:49, aiAppendMsg:56, aiShowTyping:65, aiBuildContext:82, aiSend:90, _fabPenyCheck:132, fabPenyToggleMenu:156, _fabPenyCloseMenu:160, _fabScrollToLast:164, fabDoAddPes:172, fabDoAddGuru:177
**Pemboleh ubah:** _aiHist:7, _aiOpened:8, _aiBusy:9, AI_SARANAN_AWAL:11, AI_MESEJ_BELUM_LOGIN:18

## laporan-sekolah.js — 798 baris, 45 KB

_Jumlah: 341 fungsi, 92 pemboleh ubah aras atas._
