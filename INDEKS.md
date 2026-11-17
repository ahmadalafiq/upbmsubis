# INDEKS FUNGSI (dijana automatik — jangan edit tangan)
Jana semula: `python3 tools/jana_indeks.py`. Rujuk `STRUKTUR.md` untuk gambaran keseluruhan.

## js/01-config-dispatcher.js — 459 baris, 21 KB
**Fungsi:** _mapProgramOut:21, _mapPenyertaanOut:40, _mapPencapaianOut:64, _mapSekolahOut:85, _mapAkaunOut:89, _rowArrToPenyertaanIn:104, _throwIfErr:124, _fetchAllPaged:133, _supaDispatch:148, _uniq:458
**Pemboleh ubah:** SUPABASE_URL:4, SUPABASE_ANON_KEY:5, sb:6, TBL_PROGRAM:14, TBL_PENYERTAAN:15, TBL_PENCAPAIAN:16, TBL_PENGGUNA:17, TBL_SEKOLAH:18

## js/02-core.js — 385 baris, 18 KB
**Fungsi:** _initRealtimeSync:33, esc:91, hlMatch:93, getTPT:111, _normPeringkat:121, mPts:132, cGet:150, cSet:151, cBust:152, onTahunChange:155, initTahunSel:164, run:198, showOv:251, hideOv:252, setBtn:253, _isPenyFormAktif:258, _tunjukDialogTinggal:273, _doShowPage:294, showPage:313, _resetTabFilters:324, togMarkah:356, buildMarkahGrid:362, askConfirm:375
**Pemboleh ubah:** _realtimeBustTimer:30, _realtimeQueue:31, LOGO_URL:78, LOGO_FULL:79, selId:80, _salinanPayload:81, gCnt:82, eId:83, _pps:84, markahOpen:85, _rk:86, _aP:87, _selTahun:88, MARKAH:100, PER_ORDER:108, TPT_STANDARD:109, TPT_TERBUKA:110, DAYS:112, MTHS:113, PERINGKAT_ALIAS:116, _peringkatWarnings:120, _C:149, RFN:188, _WRITE_FNS:191

## js/03-program-senarai.js — 659 baris, 31 KB
**Fungsi:** getKatChecked:2, handleKatCheck:6, daftarProgram:22, clearPF:49, loadProgs:60, populateMonthFilt:109, _setStab:130, _updateStabCounts:138, applyProgFilt:149, clearProgFilt:168, renderProgList:174, progCard:223, tutupRow:310, reqLihat:346, lihatPeny:350, reqPadamSek:455, padamSekPeny:468, _editSekolahDariBullet:483, reqEditSek:498, _openPenyertaanEdit:519, _prefillPenyertaanEdit:572, reqEdit:608, openEdit:618
**Pemboleh ubah:** _activeStab:129

## js/04-program-edit-pencapaian.js — 546 baris, 30 KB
**Fungsi:** _onEditChange:3, saveEdit:19, renderPcForm:90, _autoFillBrkKsl:376, _fillBrkFromScores:509
**Pemboleh ubah:** _editSaved:2, _brkPesList:375

## js/05-pencapaian-rumusan.js — 545 baris, 27 KB
**Fungsi:** _chkdBuild:2, _chkdRenderList:48, _chkdFilter:70, _chkdToggle:74, _chkdUpdateTags:107, _chkdGetSel:135, rPGKat:142, updateMarkah:161, _collectPencEntries:178, savePenc:231, _buildPencConfirm:237, doSavePenc:337, reqPadam:383, padamProg:388, reqRum:395, doRumusan:400, buildRum:417

## js/06-print-export.js — 695 baris, 48 KB
**Fungsi:** buildPrintPortal:3, dBox:415, dBoxBJ:420, printRum:446, _numTeks:456, _csvCell:465, _xlTeksSheets:472, _xlTeksLajur:482, _kpSel:492, expCSV:496, reqXlsx:533, expXlsx:538, _buildXlsxWorkbook:562

## js/07-penyertaan-draf.js — 571 baris, 29 KB
**Fungsi:** _penyAutoSave:9, _startPenyAutoSave:21, _stopPenyAutoSave:25, _checkPenyDraft:30, _draftSambung:60, _draftReset:64, _draftBuang:71, _restorePenyDraft:77, loadProgsForPeny:106, setPenyView:141, applyPenyFilt:151, renderPenyList:167, pilihProg:232, _lihatSekolahDlmProgram:307, _buildKatLegend:347, addMainGuru:357, removeMainGuru:365, _getGuruSyorFromAP:370, _getPesSyorFromAP:388, renderMainGuruList:410, pickGuruFromSyor:450, _fmtTel60:463, fmtTel:480, normTel:487, fmtKP:500, normKP:522, saveGuru:529, addMainPes:538, _autoAssignKatByJantina:547, removeMainPes:567
**Pemboleh ubah:** _progForPny:5, _penyAutoSaveTimer:8, _penyView:139, _syorGuruCache:407, _syorPesCache:408

## js/08-penyertaan-bulk.js — 480 baris, 23 KB
**Fungsi:** muatTurunTemplatXlsx:2, onXlsxFileSelected:41, _prosesBulkXlsx:58, renderMainPesList:140, pickPesFromSyor:190, savePes:202, saveKatPes:210, bangOpt:237, janOpt:241, semakPeny:246, _syncFormValues:384, hantarPeny:419

## js/09-penyertaan-pdf.js — 588 baris, 26 KB
**Fungsi:** janaPdfSalinanPenyertaan:2, buildSalinanPortal:247, cetakSalinan:403, muatTurunSalinan:433, _syncBatalBtn:443, batalKemaskiniPeny:449, resetPeny:459, onKodIn:480, _showPenyForm:539, _prefillFromExisting:552

## js/10-dashboard.js — 689 baris, 34 KB
**Fungsi:** printDashRingkasan:4, _togDashSection:50, _updateDashTimestamp:59, loadDash:66, _tempatRank:98, _pelibatanDedupKey:120, getSkor:124, _hasPenc:264, _pencBadge:270, _isSekType:276, buildRank:277, moreRank:304, showDet:337, buildPenc:405, renderPencNameList:423, showPencDet:438, buildPodium:445, morePenc:556, uniByProg:574, uniSek:579, openBarList:590, renderBarList:601, filterBarList:611, clearBarListSrch:620, buildBar:624, renderBar:630, filtTable:649, renderTable:655, tableNav:656, _renderTablePage:661
**Pemboleh ubah:** PELIBATAN_DEDUP_SCOPE:111, LUAR_POLISI:117, LUAR_FAKTOR_PELIBATAN:118, _dashJenis:119, _barData:584, _barListData:589, _tbData:654

## js/11-modal-carian.js — 182 baris, 8 KB
**Fungsi:** openMo:7, closeMo:28, _openDynMo:45, _closeDynMo:52, gv:63, cntBy:64, uniqGuru:65, uniqPes:66, fd:67, _trackAccess:68, _fmtAccess:83, toast:90, printSdet:103, filterMore:114, clearMoreSrch:143, filterMorep:153, clearMorepSrch:177
**Pemboleh ubah:** _zTop:2, _moOpenCount:5, _moFocusStack:6, _moreData:112, _morepBp:150, _morepKeys:151

## js/12-sekolah.js — 311 baris, 14 KB
**Fungsi:** loadSekolahMaster:65, _buildSekKodMap:84, _jenisSekolah:91, _filterSkorByJenis:101, _renderRkType:118, _setRkJenis:125, onSugSekPeny:136, pickSekPeny:153, _syncDafSekDisplay:161, onSekSelect:170, _getSekSuggestions:222, _getNamaSekolahByKod:246, hideSug:257, onSugKodProg:265, onSugPengelolaProg:282, pickSugProg:299, _populateDafSekDropdown:309, onDafSekSelect:310
**Pemboleh ubah:** _SEKOLAH_STATIK:2, _sekExtraDb:55, _sekolahMasterLoaded:64, _sekKodMap:83, _rkJenisFilter:110, _rkFull:111, _rkElMap:112

## js/13-dashboard-filter.js — 189 baris, 8 KB
**Fungsi:** setDashBidang:6, filterByBidang:18, rebuildDash:30, buildSekTiadaRekod:123
**Pemboleh ubah:** _dashBidang:2, BIDANG_SUKAN:3, BIDANG_KOKU:4

## js/14-auth-login.js — 413 baris, 17 KB
**Fungsi:** lgTab:6, lgClearMsg:16, lgMsg:23, lgToggleAdmin:28, lgDot:45, lgResetStep:50, lgCariAkaun:60, lgMasuk:135, _mulakanSesi:162, _pfNamaVal:236, _pfMaskKP:237, openProfil:238, _pfOnChange:257, simpanProfil:262, _refreshNavUser:284, _applyRoleUI:297, lgKeluarConfirm:324, lgKeluar:336
**Pemboleh ubah:** _sesi:3, _pfAsal:235

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

## js/19-sekolah-menyertai.js — 218 baris, 13 KB
**Fungsi:** _psBox:13, _psSenarai:14, psMod:18, psGet:19, psReset:23, _psKemasBil:28, psRender:32, psSetMod:66, psToggle:71, psCari:75, psKumpulan:82, psMuatEdit:97, psSimpanEdit:113, psBlokBelumDaftar:128, _tgIsuHtml:149, _tgRender:158, semakTugasanSelepasLogin:183, _tgBuka:203
**Pemboleh ubah:** _pcTicked:8, _psSel:9, _psMode:10, _psEdit:11, _tgData:143, _TG_ISU:144

## laporan-sekolah.js — 798 baris, 45 KB

_Jumlah: 336 fungsi, 97 pemboleh ubah aras atas._
