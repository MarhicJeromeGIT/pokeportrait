document.body.style.border = "5px solid red";

// pokemon list from http://pokemon.wikia.com/wiki/List_of_Pok%C3%A9mon
// pokemon sprites from http://veekun.com/ and http://pokemondb.net/sprites

var pokedexInfo;
var timeOutVar;
var currentPokemon;
var currentlyShowing;
var mouseEvent;

var options = {
	portrait : 	true,
	english :	true,
	french :	true,
	german :	false,
	japanese :	false,
	pokindex : 	false
};

function findHoveredWord(ev)
{
  let range;
  let hoveredNode;
  let offset;

  if (document.caretPositionFromPoint) {
    range = document.caretPositionFromPoint(ev.clientX, ev.clientY);
    hoveredNode = range.offsetNode;
    offset = range.offset;    
  } else if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(ev.clientX, ev.clientY);
    hoveredNode = range.startContainer;
    offset = range.startOffset;
  } 

	if( hoveredNode.nodeValue == null )
	{
		return "notexthere";
	}
	//console.log(hoveredNode.nodeValue + " : " + offset );
	
	// Get the entire highlighted word
	var inWord = false;
	var wordStartIndex = 0;
  var currentWord = "";
  // console.log("NODE VALUE : " + hoveredNode.nodeValue)
  // console.log("OFFSET : " + offset)

  var str = hoveredNode.nodeValue;
  var left = str.slice(0, offset + 1).search(/\S+$/),
  right = str.slice(offset).search(/\s/);

  // The last word in the string is a special case.
  if (right < 0) {
    return str.slice(left);
  }

  // Return the word, using the located bounds to extract it from the string.
  return str.slice(left, right + offset);
}

// If it's a pokemon, return it's pokindex, otherwise return -1
function getPokindex( hoveredWord )
{
	for( var i=0; i< pokedexInfo.length; i++ )
	{
		var regEn = new RegExp( pokedexInfo[i].english , "gi" );
		//var regFr = new RegExp( pokedexInfo[i].french , "gi" );
		//var regGr = new RegExp( pokedexInfo[i].german , "gi" );
		if( hoveredWord.match( regEn ) )
		{
			//console.log("It's a "+pokedexInfo[i].english);
			return i;
		}
	}
	
	return -1;
}

function showDialog( pokindex )
{
	var nationalPokedexNumber = pokedexInfo[pokindex].natIndex;
	//console.log("showing dialog for "+nationalPokedexNumber);
	
	if( nationalPokedexNumber < 650 )
	{
		// var imgUrl =  chrome.extension.getURL();
		var imgUrl = browser.runtime.getURL("./pokemon/dream-world/"+nationalPokedexNumber+".svg");
		console.log(imgUrl);
	}
	else
	{
		// var imgUrl =  chrome.extension.getURL("./pokemon/dream-world/"+nationalPokedexNumber+".png");
		var imgUrl = browser.runtime.getURL("./pokemon/dream-world/"+nationalPokedexNumber+".png");
		console.log(imgUrl);
	}
	var dialogContent = "";
	if( options.portrait ){
		dialogContent += '<img src='+imgUrl+' width="150" height="150"></img>';
	}
	dialogContent += '<p class="dialogType" >Type : '+pokedexInfo[pokindex].typeI;
	if( pokedexInfo[pokindex].typeII != "none" )
	{
		dialogContent += " / " + pokedexInfo[pokindex].typeII;
	}
	if( options.english ){
		dialogContent += '<br/>English : '+pokedexInfo[pokindex].english;
	}
	if( options.japanese ){
		dialogContent += '<br/>Japanese : '+pokedexInfo[pokindex].japanese;
	}
	if( options.french ){
		dialogContent += '<br/>French : '+pokedexInfo[pokindex].french;
	}
	if( options.german ){
		dialogContent += '<br/>German : '+pokedexInfo[pokindex].german;
	}
	if( options.pokindex ){
		dialogContent += '<br/>Pokedex #'+nationalPokedexNumber;
	}
	dialogContent    += '</p>';
	
	$("#pokemonPopup").html(dialogContent);	
	$("#pokemonPopup").dialog({ dialogClass: "no-close",
								width: 150
							});
	$('#pokemonPopup').dialog( {position : { my: "left top+20", at: "left bottom-10", of: mouseEvent } } );
	$('#pokemonPopup').dialog('open');
	
	// Close the window after X ms
	var time = 3000;
	clearTimeout(timeOutVar);
	timeOutVar = setTimeout(function(){ $('#pokemonPopup').dialog('close'); currentlyShowing = false }, time);
}

function onMouseMoved(ev)
{
  var hoveredWord = findHoveredWord(ev);
  console.log("Hovered word : " + hoveredWord);
	var pokindex = getPokindex( hoveredWord );
	
	if( pokindex > -1 )
	{
    console.log("Pokindex : " + pokindex);
		// if the dialog is not showing already
		if( !$('#pokemonPopup').dialog('isOpen') || currentPokemon != pokindex )
		{
			showDialog( pokindex );
			currentPokemon = pokindex;
		}
	}
	else // no pokemon name hovered, close the dialog
	{
		if( $('#pokemonPopup').dialog('isOpen') )
		{
			$('#pokemonPopup').dialog('close');
			currentlyShowing = false;
		}
	}
}

$(document).ready(function()
{
	console.log("ready");
	
	// Inject code for my dialog 
	var dialogStyle = "";//"\"background-color:white\"";
	var inject  = document.createElement("div");
	inject.innerHTML = "<div id='pokemonPopup' style="+dialogStyle+"></div>";
	document.body.insertBefore (inject, document.body.firstChild);
	
	// Get the options
	// chrome.storage.sync.get({
  //   portrait: 	true,
	// english: 	true,
	// french: 	true,
	// german: 	false,
	// japanese:	false,
	// pokindex: 	true
  // }, function(items) {
	// options.portrait 	= items.portrait;
	// options.english 	= items.english;
	// options.french 		= items.french;
	// options.german 		= items.german;
	// options.japanese 	= items.japanese;
	// options.pokindex 	= items.pokindex;
  // });
	
	// load the pokedex info
	pokedexInfo = getPokedex();
	timeOutVar = -1;
	currentPokemon = -1;
	currentlyShowing = false;

	// Ready the dialog		
	//$("#pokemonPopup").css( "border-style", "solid" );
	$("#pokemonPopup").dialog({ autoOpen: false,
							});
	
	$(document).on("mousemove", onMouseMoved);
	
});



function getPokedex()
{
  var typeInfo = getGenI() + getGenII() + getGenIII() + getGenIV() + getGenV() + getGenVI();
  var typeData = typeInfo.split("\n");
  console.log("TYPE INFO LENGTH : " + typeData.length)

	var pokeNames = [];
	var pokeTypes = Array(800);
	var nameInfo = getAllGenNames().split("\n");;
	
	// Type data 
	for( var i=0; i<typeData.length; i++ )
	{
		var split = typeData[i].split("\t");
		pokeTypes[ parseInt(split[0]) ] = { typeI : split[3],
								  typeII : split[4] };
	}
	//console.log(pokeTypes);
	
	for( var i=0 ; i< nameInfo.length; i++ )
	{
		var namesSplit = nameInfo[i].split("\t");
		var idx = parseInt(namesSplit[0]);
		// console.log(idx);
		var pokeName = { natIndex	: idx,
						 english	: namesSplit[3],
						 japanese	: namesSplit[5],
						 french		: namesSplit[2],
             german		: namesSplit[4]
    };
    var poketype = pokeTypes[idx];
    if(poketype != undefined) {
      pokeName['typeI'] = pokeTypes[idx].typeI
      pokeName['typeII'] = pokeTypes[idx].typeII
    }

		pokeNames.push(pokeName);
	}
	//console.log( pokeNames );
	return pokeNames;
}

/*	var pageContent = $("body").html();
	
	var pokeNames = getPokeNames();
	for( var i=0; i < pokeNames.length; i++ )
	{
		var myRegex = new RegExp( "("+pokeNames[i].name+")","gi");
		var replacement = '<b id="pokemon" pokindex="'+(pokeNames[i].pokedex)+'">'+'$1'+'</b>';
		pageContent = pageContent.replace( myRegex, replacement);
	}
	
	//var replaced = pageContent.replace(/pikachu/gi, '<b id="pokemon" pokindex="0">pikachu</b>');
	//var replaced = replaced.replace(/raichu/gi, '<b id="pokemon" pokindex="1" >raichu</b>');
	$("body").html( pageContent + "<div id='pokemonPopup' ></div>");
//<div id="pokemonPopup" ></div>
	//	console.log(pageContent);		
	
	$("b#pokemon").hover( 
		function(){
			console.log("hovering"+$(this));
			$(this).css("color","red");
			var pokindex = $(this).attr("pokindex");
			
			var imgUrl =  chrome.extension.getURL("./pokemon/dream-world/"+pokindex+".svg");
			
			$("#pokemonPopup").html('<img src='+imgUrl+' width="150" height="150"></img>');			
			$("#pokemonPopup").css( "border-style", "solid" );
			$("#pokemonPopup").dialog({ autoOpen: false });
			$('#pokemonPopup').dialog( {position : { my: "left top", at: "left bottom", of: $(this) } } );
			$('#pokemonPopup').dialog('open');
		},
		function(){
			$(this).css("color","black");
			$('#dialog').dialog('close');
		});
*/

function getAllGenNames()
{
var all = function(){/*001	001	Bulbizarre	Bulbasaur	Bisasam	フシギダネ Fushigidane
002	002	Herbizarre	Ivysaur	Bisaknosp	フシギソウ (Fushigisō) Fushigisou
003	003	Florizarre	Venusaur	Bisaflor	フシギバナ Fushigibana
004	004	Salamèche	Charmander	Glumanda	ヒトカゲ Hitokage
005	005	Reptincel	Charmeleon	Glutexo	リザード (Rizādo) Lizardo
006	006	Dracaufeu	Charizard	Glurak	リザードン (Rizādon) Lizardon
007	007	Carapuce	Squirtle	Schiggy	ゼニガメ Zenigame
008	008	Carabaffe	Wartortle	Schillok	カメール (Kamēru) Kameil
009	009	Tortank	Blastoise	Turtok	カメックス (Kamekkusu) Kamex
010	010	Chenipan	Caterpie	Raupy	キャタピー (Kyatapī) Caterpie
011	011	Chrysacier	Metapod	Safcon	トランセル (Toranseru) Trancell
012	012	Papilusion	Butterfree	Smettbo	バタフリー (Batafurī) Butterfree
013	013	Aspicot	Weedle	Hornliu	ビードル (Bīdoru) Beedle
014	014	Coconfort	Kakuna	Kokuna	コクーン (Kokūn) Cocoon
015	015	Dardargnan	Beedrill	Bibor	スピアー (Supiā) Spear
016	016	Roucool	Pidgey	Taubsi	ポッポ Poppo
017	017	Roucoups	Pidgeotto	Tauboga	ピジョン (Pijon) Pigeon
018	018	Roucarnage	Pidgeot	Tauboss	ピジョット (Pijotto) Pigeot
019	019	Rattata	Rattata	Rattfratz	コラッタ Koratta
020	020	Rattatac	Raticate	Rattikarl	ラッタ Ratta
021	021	Piafabec	Spearow	Habitak	オニスズメ Onisuzume
022	022	Rapasdepic	Fearow	Ibitak	オニドリル (Onidoriru) Onidrill
023	023	Abo	Ekans	Rettan	アーボ (Ābo) Arbo
024	024	Arbok	Arbok	Arbok	アーボック (Ābokku) Arbok
025	025	Pikachu	Pikachu	Pikachu	ピカチュウ (Pikachū) Pikachu
026	026	Raichu	Raichu	Raichu	ライチュウ (Raichū) Raichu
027	027	Sabelette	Sandshrew	Sandan	サンド (Sando) Sand
028	028	Sablaireau	Sandslash	Sandamer	サンドパン (Sandopan) Sandpan
029	029	Nidoran♀	Nidoran♀	Nidoran♀	ニドラン♀ Nidoran♀
030	030	Nidorina	Nidorina	Nidorina	ニドリーナ (Nidorīna) Nidorina
031	031	Nidoqueen	Nidoqueen	Nidoqueen	ニドクイン (Nidokuin) Nidoqueen
032	032	Nidoran♂	Nidoran♂	Nidoran♂	ニドラン♂ Nidoran♂
033	033	Nidorino	Nidorino	Nidorino	ニドリーノ (Nidorīno) Nidorino
034	034	Nidoking	Nidoking	Nidoking	ニドキング (Nidokingu) Nidoking
035	035	Mélofée	Clefairy	Piepi	ピッピ Pippi
036	036	Mélodelfe	Clefable	Pixi	ピクシー (Pikushī) Pixy
037	037	Goupix	Vulpix	Vulpix	ロコン Rokon
038	038	Feunard	Ninetales	Vulnona	キｭウコン (Kyūkon) Kyukon
039	039	Rondoudou	Jigglypuff	Pummeluff	プリン Purin
040	040	Grodoudou	Wigglytuff	Knuddeluff	プクリン Pukurin
041	041	Nosferapti	Zubat	Zubat	ズバット (Zubatto) Zubat
042	042	Nosferalto	Golbat	Golbat	ゴルバット (Gorubatto) Golbat
043	043	Mystherbe	Oddish	Myrapla	ナゾノクサ Nazonokusa
044	044	Ortide	Gloom	Duflor	クサイハナ Kusaihana
045	045	Rafflesia	Vileplume	Giflor	ラフレシア (Rafureshia) Ruffresia
046	046	Paras	Paras	Paras	パラス (Parasu) Paras
047	047	Parasect	Parasect	Parasek	パラセクト (Parasekuto) Parasect
048	048	Mimitoss	Venonat	Bluzuk	コンパン (Konpan) Kongpang
049	049	Aéromite	Venomoth	Omot	モルフォン (Morufon) Morphon
050	050	Taupiqueur	Diglett	Digda	ディグダ (Diguda) Digda
051	051	Triopikeur	Dugtrio	Digdri	ダグトリオ (Dagutorio) Dugtrio
052	052	Miaouss	Meowth	Mauzi	ニャース (Nyāsu) Nyarth
053	053	Persian	Persian	Snobilikat	ペルシアン (Perushian) Persian
054	054	Psykokwak	Psyduck	Enton	コダック (Kodakku) Koduck
055	055	Akwakwak	Golduck	Entoron	ゴルダック (Gorudakku) Golduck
056	056	Férosinge	Mankey	Menki	マンキー (Mankī) Mankey
057	057	Colossinge	Primeape	Rasaff	オコリザル Okorizaru
058	058	Caninos	Growlithe	Fukano	ガーディ (Gādi) Gardie
059	059	Arcanin	Arcanine	Arkani	ウインディ (Uindi) Windie
060	060	Ptitard	Poliwag	Quapsel	ニョロモ Nyoromo
061	061	Têtarte	Poliwhirl	Quaputzi	ニョロゾ Nyorozo
062	062	Tartard	Poliwrath	Quappo	ニョロボン Nyorobon
063	063	Abra	Abra	Abra	ケーシィ (Kēshī) Casey
064	064	Kadabra	Kadabra	Kadabra	ユンゲラー (Yungerā) Yungerer
065	065	Alakazam	Alakazam	Simsala	フーディン (Fūdin) Foodin
066	066	Machoc	Machop	Machollo	ワンリキー (Wanrikī) Wanriky
067	067	Machopeur	Machoke	Maschock	ゴーリキー (Gōrikī) Goriky
068	068	Mackogneur	Machamp	Machomei	カイリキー (Kairikī) Kairiky
069	069	Chétiflor	Bellsprout	Knofensa	マダツボミ Madatsubomi
070	070	Boustiflor	Weepinbell	Ultrigaria	ウツドン Utsudon
071	071	Empiflor	Victreebel	Sarzenia	ウツボット (Utsubotto) Utsubot
072	072	Tentacool	Tentacool	Tentacha	メノクラゲ Menokurage
073	073	Tentacruel	Tentacruel	Tentoxa	ドククラゲ Dokukurage
074	074	Racaillou	Geodude	Kleinstein	イシツブテ Ishitsubute
075	075	Gravalanch	Graveler	Georok	ゴローン (Gorōn) Golone
076	076	Grolem	Golem	Geowaz	ゴローニャ (Gorōnya) Golonya
077	077	Ponyta	Ponyta	Ponita	ポニータ (Ponīta) Ponyta
078	078	Galopa	Rapidash	Gallopa	ギャロップ (Gyaroppu) Gallop
079	079	Ramoloss	Slowpoke	Flegmon	ヤドン Yadon
080	080	Flagadoss	Slowbro	Lahmus	ヤドラン Yadoran
081	081	Magnéti	Magnemite	Magnetilo	コイル (Koiru) Coil
082	082	Magnéton	Magneton	Magneton	レアコイル (Reakoiru) Rarecoil
083	083	Canarticho	Farfetch'd	Porenta	カモネギ Kamonegi
084	084	Doduo	Doduo	Dodu	ドードー (Dōdō) Dodo
085	085	Dodrio	Dodrio	Dodri	ドードリオ (Dōdorio) Dodorio
086	086	Otaria	Seel	Jurob	パウワウ (Pauwau) Pawou
087	087	Lamantine	Dewgong	Jugong	ジュゴン Jugon
088	088	Tadmorv	Grimer	Sleima	ベトベター (Betobetā) Betbeter
089	089	Grotadmorv	Muk	Sleimok	ベトベトン (Betobeton) Betbeton
090	090	Kokiyas	Shellder	Muschas	シェルダー (Sherudā) Shellder
091	091	Crustabri	Cloyster	Austos	パルシェン (Parushen) Parshen
092	092	Fantominus	Gastly	Nebulak	ゴース (Gōsu) Ghos
093	093	Spectrum	Haunter	Alpollo	ゴースト (Gōsuto) Ghost
094	094	Ectoplasma	Gengar	Gengar	ゲンガー (Gengā) Gangar
095	095	Onix	Onix	Onix	イワーク (Iwāku) Iwark
096	096	Soporifik	Drowzee	Traumato	スリープ (Surīpu) Sleep
097	097	Hypnomade	Hypno	Hypno	スリーパー (Surīpā) Sleeper
098	098	Krabby	Krabby	Krabby	クラブ (Kurabu) Crab
099	099	Krabboss	Kingler	Kingler	キングラー (Kingurā) Kingler
100	100	Voltorbe	Voltorb	Voltobal	ビリリダマ Biriridama
101	101	Électrode	Electrode	Lektrobal	マルマイン (Marumain) Marumine
102	102	Nœunœuf	Exeggcute	Owei	タマタマ Tamatama
103	103	Noadkoko	Exeggutor	Kokowei	ナッシー (Nasshī) Nassy
104	104	Osselait	Cubone	Tragosso	カラカラ Karakara
105	105	Ossatueur	Marowak	Knogga	ガラガラ Garagara
106	106	Kicklee	Hitmonlee	Kicklee	サワムラー (Sawamurā) Sawamular
107	107	Tygnon	Hitmonchan	Nockchan	エビワラー (Ebiwarā) Ebiwalars
108	108	Excelangue	Lickitung	Schlurp	ベロリンガ Beroringa
109	109	Smogo	Koffing	Smogon	ドガース (Dogāsu) Dogars
110	110	Smogogo	Weezing	Smogmog	マタドガス (Matadogasu) Matadogas
111	111	Rhinocorne	Rhyhorn	Rihorn	サイホーン (Saihōn) Sihorn
112	112	Rhinoféros	Rhydon	Rizeros	サイドン (Saidon) Sidon
113	113	Leveinard	Chansey	Chaneira	ラッキー (Rakkī) Lucky
114	114	Saquedeneu	Tangela	Tangela	モンジャラ Monjara
115	115	Kangourex	Kangaskhan	Kangama	ガルーラ (Garūra) Garura
116	116	Hypotrempe	Horsea	Seeper	タッツー (Tattsū) Tattu
117	117	Hypocéan	Seadra	Seemon	シードラ (Shīdora) Seadra
118	118	Poissirène	Goldeen	Goldini	トサキント Tosakinto
119	119	Poissoroy	Seaking	Golking	アズマオウ (Azumaō) Azumao
120	120	Stari	Staryu	Sterndu	ヒトデマン Hitodeman
121	121	Staross	Starmie	Starmie	スターミー (Sutāmī) Starmie
122	122	M. Mime	Mr. Mime	Pantimos	バリヤード (Bariyādo) Barrierd
123	123	Insécateur	Scyther	Sichlor	ストライク (Sutoraiku) Strike
124	124	Lippoutou	Jynx	Rossana	ルージュラ (Rūjura) Rougela
125	125	Élektek	Electabuzz	Elektek	エレブー (Erebū) Eleboo
126	126	Magmar	Magmar	Magmar	ブーバー (Būbā) Boober
127	127	Scarabrute	Pinsir	Pinsir	カイロス (Kairosu) Kailios
128	128	Tauros	Tauros	Tauros	ケンタロス (Kentarosu) Kentauros
129	129	Magicarpe	Magikarp	Karpador	コイキング (Koikingu) Koiking
130	130	Léviator	Gyarados	Garados	ギャラドス (Gyaradosu) Gyarados
131	131	Lokhlass	Lapras	Lapras	ラプラス (Rapurasu) Laplace
132	132	Métamorph	Ditto	Ditto	メタモン Metamon
133	133	Évoli	Eevee	Evoli	イーブイ (Ībui) Eievui
134	134	Aquali	Vaporeon	Aquana	シャワーズ (Shawāzu) Showers
135	135	Voltali	Jolteon	Blitza	サンダース (Sandāsu) Thunders
136	136	Pyroli	Flareon	Flamara	ブースター (Būsutā) Booster
137	137	Porygon	Porygon	Porygon	ポリゴン (Porigon) Porygon
138	138	Amonita	Omanyte	Amonitas	オムナイト (Omunaito) Omnite
139	139	Amonistar	Omastar	Amoroso	オムスター (Omusutā) Omstar
140	140	Kabuto	Kabuto	Kabuto	カブト Kabuto
141	141	Kabutops	Kabutops	Kabutops	カブトプス (Kabutopusu) Kabutops
142	142	Ptéra	Aerodactyl	Aerodactyl	プテラ (Putera) Ptera
143	143	Ronflex	Snorlax	Relaxo	カビゴン Kabigon
144	144	Artikodin	Articuno	Arktos	フリーザー (Furīzā) Freezer
145	145	Électhor	Zapdos	Zapdos	サンダー (Sandā) Thunder
146	146	Sulfura	Moltres	Lavados	ファイヤー (Faiyā) Fire
147	147	Minidraco	Dratini	Dratini	ミニリｭウ (Miniryū) Miniryu
148	148	Draco	Dragonair	Dragonir	ハクリュー (Hakuryū) Hakuryu
149	149	Dracolosse	Dragonite	Dragoran	カイリｭウ (Kairyū) Kairyu
150	150	Mewtwo	Mewtwo	Mewtu	ミｭウツ (Myūtsu) Mewtwo
151	151	Mew	Mew	Mew	ミｭウ (Myū) Mew
152	152	Germignon	Chikorita	Endivie	チコリータ (Chikorīta) Chicorita
153	153	Macronium	Bayleef	Lorblatt	ベイリーフ (Beirīfu) Bayleaf
154	154	Méganium	Meganium	Meganie	メガニウム (Meganiumu) Meganium
155	155	Héricendre	Cyndaquil	Feurigel	ヒノアラシ Hinoarashi
156	156	Feurisson	Quilava	Igelavar	マグマラシ (Magumarashi) Magmarashi
157	157	Typhlosion	Typhlosion	Tornupto	バクフーン (Bakufūn) Bakphoon
158	158	Kaiminus	Totodile	Karnimani	ワニノコ Waninoko
159	159	Crocrodil	Croconaw	Tyracroc	アリゲイツ (Arigeitsu) Alligates
160	160	Aligatueur	Feraligatr	Impergator	オーダイル (Ōdairu) Ordile
161	161	Fouinette	Sentret	Wiesor	オタチ Otachi
162	162	Fouinar	Furret	Wiesenior	オオタチ (Ōtachi) Ootachi
163	163	Hoothoot	Hoothoot	Hoothoot	ホーホー (Hōhō) Hoho
164	164	Noarfang	Noctowl	Noctuh	ヨルノズク Yorunozuku
165	165	Coxy	Ledyba	Ledyba	レディバ Rediba
166	166	Coxyclaque	Ledian	Ledian	レディアン Redian
167	167	Mimigal	Spinarak	Webarak	イトマル Itomaru
168	168	Migalos	Ariados	Ariados	アリアドス (Ariadosu) Ariados
169	169	Nostenfer	Crobat	Iksbat	クロバット (Kurobatto) Crobat
170	170	Loupio	Chinchou	Lampi	チョンチー (Chonchī) Chonchie
171	171	Lanturn	Lanturn	Lanturn	ランターン (Rantān) Lantern
172	172	Pichu	Pichu	Pichu	ピチュー (Pichū) Pichu
173	173	Mélo	Cleffa	Pii	ピィ (Pyi) Py
174	174	Toudoudou	Igglybuff	Fluffeluff	ププリン Pupurin
175	175	Togepi	Togepi	Togepi	トゲピー (Togepī) Togepy
176	176	Togetic	Togetic	Togetic	トゲチック (Togechikku) Togechick
177	177	Natu	Natu	Natu	ネイティ (Neiti) Naty
178	178	Xatu	Xatu	Xatu	ネイティオ (Neitio) Natio
179	179	Wattouat	Mareep	Voltilamm	メリープ (Merīpu) Merriep
180	180	Lainergie	Flaaffy	Waaty	モココ Mokoko
181	181	Pharamp	Ampharos	Ampharos	デンリュウ (Denryū) Denryu
182	182	Joliflor	Bellossom	Blubella	キレイハナ Kireihana
183	183	Marill	Marill	Marill	マリル (Mariru) Maril
184	184	Azumarill	Azumarill	Azumarill	マリルリ (Mariruri) Marilli
185	185	Simularbre	Sudowoodo	Mogelbaum	ウソッキー (Usokkī) Usokkie
186	186	Tarpaud	Politoed	Quaxo	ニョロトノ Nyorotono
187	187	Granivol	Hoppip	Hoppspross	ハネッコ (Hanekko) Hanecco
188	188	Floravol	Skiploom	Hubelupf	ポポッコ (Popokko) Popocco
189	189	Cotovol	Jumpluff	Papungha	ワタッコ (Watakko) Watacco
190	190	Capumain	Aipom	Griffel	エイパム (Eipamu) Eipam
191	191	Tournegrin	Sunkern	Sonnkern	ヒマナッツ (Himanattsu) Himanuts
192	192	Héliatronc	Sunflora	Sonnflora	キマワリ Kimawari
193	193	Yanma	Yanma	Yanma	ヤンヤンマ Yanyanma
194	194	Axoloto	Wooper	Felino	ウパー (Upā) Upah
195	195	Maraiste	Quagsire	Morlord	ヌオー (Nuō) Nuoh
196	196	Mentali	Espeon	Psiana	エーフィ (Ēfi) Eifie
197	197	Noctali	Umbreon	Nachtara	ブラッキ (Burakkī) Blacky
198	198	Cornèbre	Murkrow	Kramurx	ヤミカラス Yamikarasu
199	199	Roigada	Slowking	Laschoking	ヤドキング (Yadokingu) Yadoking
200	200	Feuforêve	Misdreavus	Traunfugil	ムーマ (Mūma) Muma
201	201	Zarbi	Unown	Icognito	アンノーン (Annōn) Unknown
202	202	Qulbutoké	Wobbuffet	Woingenau	ソーナンス (Sōnansu) Sonans
203	203	Girafarig	Girafarig	Girafarig	キリンリキ Kirinriki
204	204	Pomdepik	Pineco	Tannza	クヌギダマ Kunugidama
205	205	Foretress	Forretress	Forstellka	フォレトス (Foretosu) Foretos
206	206	Insolourdo	Dunsparce	Dummisel	ノコッチ Nokocchi
207	207	Scorplane	Gligar	Skorgla	グライガー (Guraigā) Gliger
208	208	Steelix	Steelix	Stahlos	ハガネール (Haganeeru) Haganeil
209	209	Snubbull	Snubbull	Snubbull	ブルー (Burū) Bulu
210	210	Granbull	Granbull	Granbull	グランブル (Guranburu) Granbulu
211	211	Qwilfish	Qwilfish	Baldorfish	ハリーセン (Harīsen) Harysen
212	212	Cizayox	Scizor	Scherox	ハッサム (Hassamu) Hassam
213	213	Caratroc	Shuckle	Pottrott	ツボツボ Tsubotsubo
214	214	Scarhino	Heracross	Skaraborn	ヘラクロス (Herakurosu) Heracros
215	215	Farfuret	Sneasel	Sniebel	ニューラ (Nyūra) Nyula
216	216	Teddiursa	Teddiursa	Teddiursa	ヒメグマ Himeguma
217	217	Ursaring	Ursaring	Ursaring	リングマ Ringuma
218	218	Limagma	Slugma	Schneckmag	マグマッグ (Magumaggu) Magmag
219	219	Volcaropod	Magcargo	Magcargo	マグカルゴ (Magukarugo) Magcargot
220	220	Marcacrin	Swinub	Quiekel	ウリムー (Urimū) Urimoo
221	221	Cochignon	Piloswine	Keifel	イノムー (Inomū) Inomoo
222	222	Corayon	Corsola	Corasonn	サニーゴ (Sanīgo) Sunnygo
223	223	Rémoraid	Remoraid	Remoraid	テッポウオ (Teppōo) Teppouo
224	224	Octillery	Octillery	Octillery	オクタン (Okutan) Okutank
225	225	Cadoizo	Delibird	Botogel	デリバード (Deribādo) Delibird
226	226	Démanta	Mantine	Mantax	マンタイン Mantain
227	227	Airmure	Skarmory	Panzaeron	エアームド (Eāmudo) Airmd
228	228	Malosse	Houndour	Hunduster	デルビル (Derubiru) Delvil
229	229	Démolosse	Houndoom	Hundemon	ヘルガー (Herugā) Hellgar
230	230	Hyporoi	Kingdra	Seedraking	キングドラ (Kingudora) Kingdra
231	231	Phanpy	Phanpy	Phanpy	ゴマゾウ (Gomazō) Gomazou
232	232	Donphan	Donphan	Donphan	ドンファン Donfan
233	233	Porygon2	Porygon2	Porygon2	ポリゴン２ Porigon2
234	234	Cerfrousse	Stantler	Damhirplex	オドシシ Odoshishi
235	235	Queulorior	Smeargle	Farbeagle	ドーブル (Dōburu) Doble
236	236	Debugant	Tyrogue	Rabauz	バルキー (Barukī) Balkie
237	237	Kapoera	Hitmontop	Kapoera	カポエラー (Kapoerā) Kapoerer
238	238	Lippouti	Smoochum	Kussilla	ムチュール (Muchūru) Muchul
239	239	Élekid	Elekid	Elekid	エレキッド (Erekiddo) Elekid
240	240	Magby	Magby	Magby	ブビィ (Bubyi) Buby
241	241	Écrémeuh	Miltank	Miltank	ミルタンク (Mirutanku) Miltank
242	242	Leuphorie	Blissey	Heiteira	ハピナス (Hapinasu) Happinas
243	243	Raikou	Raikou	Raikou	ライコウ (Raikō) Raikou
244	244	Entei	Entei	Entei	エンテイ Entei
245	245	Suicune	Suicune	Suicune	スイクン Suikun
246	246	Embrylex	Larvitar	Larvitar	ヨーギラス (Yōgirasu) Yogiras
247	247	Ymphect	Pupitar	Pupitar	サナギラス (Sanagirasu) Sanagiras
248	248	Tyranocif	Tyranitar	Despotar	バンギラス (Bangirasu) Bangiras
249	249	Lugia	Lugia	Lugia	ルギア (Rugia) Lugia
250	250	Ho-Oh	Ho-Oh	Ho-Oh	ホウオウ (Hōō) Houou
251	251	Celebi	Celebi	Celebi	セレビィ (Serebyi) Celebi
252	252	Arcko	Treecko	Geckarbor	キモリ Kimori
253	253	Massko	Grovyle	Reptain	ジュプトル (Juputoru) Juptile
254	254	Jungko	Sceptile	Gewaldro	ジュカイン Jukain
255	255	Poussifeu	Torchic	Flemmli	アチャモ Achamo
256	256	Galifeu	Combusken	Jungglut	ワカシャモ (Wakashamo) Wakasyamo
257	257	Braségali	Blaziken	Lohgock	バシャーモ (Bashāmo) Bursyamo
258	258	Gobou	Mudkip	Hydropi	ミズゴロウ (Mizugorō) Mizugorou
259	259	Flobio	Marshtomp	Moorabbel	ヌマクロー (Numakorō) Numacraw
260	260	Laggron	Swampert	Sumpex	ラグラージ (Ragurāji) Laglarge
261	261	Medhyèna	Poochyena	Fiffyen	ポチエナ Pochiena
262	262	Grahyèna	Mightyena	Magnayen	グラエナ Guraena
263	263	Zigzaton	Zigzagoon	Zigzachs	ジグザグマ Ziguzaguma
264	264	Linéon	Linoone	Geradaks	マッスグマ Massuguma
265	265	Chenipotte	Wurmple	Waumpel	ケムッソ Kemusso
266	266	Armulys	Silcoon	Schaloko	カラサリス (Karasairu) Karasalis
267	267	Charmillon	Beautifly	Papinella	アゲハント (Agehanto) Agehunt
268	268	Blindalys	Cascoon	Panekon	マユルド (Mayurudo) Mayuld
269	269	Papinox	Dustox	Pudox	ドクケイル (Dokukeiru) Dokucale
270	270	Nénupiot	Lotad	Loturzel	ハスボー (Hasubō) Hassboh
271	271	Lombre	Lombre	Lombrero	ハスブレロ (Hasuburero) Hasubrero
272	272	Ludicolo	Ludicolo	Kappalores	ルンパッパ Runpappa
273	273	Grainipiot	Seedot	Samurzel	タネボー (Tanebō) Taneboh
274	274	Pifeuil	Nuzleaf	Blanas	コノハナ Konohana
275	275	Tengalice	Shiftry	Tengulist	ダーテング (Dātengu) Dirteng
276	276	Nirondelle	Taillow	Schwalbini	スバメ Subame
277	277	Hélédelle	Swellow	Schwalboss	オオスバメ (Ōsubame) Ohsubame
278	278	Goélise	Wingull	Wingull	キャモメ (Kyamome) Camome
279	279	Bekipan	Pelipper	Pelipper	ペリッパー (Perippā) Pelipper
280	280	Tarsal	Ralts	Trasla	ラルトス (Rarutosu) Ralts
281	281	Kirlia	Kirlia	Kirlia	キルリア (Kiruria) Kirlia
282	282	Gardevoir	Gardevoir	Guardevoir	サーナイト (Sānaito) Sirnight
283	283	Arakdo	Surskit	Gehweiher	アメタマ Ametama
284	284	Maskadra	Masquerain	Maskeregen	アメモース (Amemōsu) Amemoth
285	285	Balignon	Shroomish	Knilz	キノココ (Kinokoko) Kinococo
286	286	Chapignon	Breloom	Kapilz	キノガッサ Kinogassa
287	287	Parecool	Slakoth	Bummelz	ナマケロ Yamakerro
288	288	Vigoroth	Vigoroth	Muntier	ヤルキモノ Yarukimono
289	289	Monaflèmit	Slaking	Letarking	ケッキング (Kekkingu) Kekking
290	290	Ningale	Nincada	Nincada	ツチニン (Tsuchinin) Tutinin
291	291	Ninjask	Ninjask	Ninjask	テッカニン Tekkanin
292	292	Munja	Shedinja	Ninjatom	ヌケニン Nukenin
293	293	Chuchmur	Whismur	Flurmel	ゴニョニョ Gonyonyo
294	294	Ramboum	Loudred	Krakeelo	ドゴーム (Dogōmu) Dogohmb
295	295	Brouhabam	Exploud	Krawumms	バクオング (Bakuongu) Bakuong
296	296	Makuhita	Makuhita	Makuhita	マクノシタ Makunoshita
297	297	Hariyama	Hariyama	Hariyama	ハリテヤマ Hariteyama
298	298	Azurill	Azurill	Azurill	ルリリ Ruriri
299	299	Tarinor	Nosepass	Nasgnet	ノズパス (Nozupasu) Nosepass
300	300	Skitty	Skitty	Eneco	エネコ (Eneko) Eneco
301	301	Delcatty	Delcatty	Enekoro	エネコロロ Enekororo
302	302	Ténéfix	Sableye	Zobiris	ヤミラミ Yamirami
303	303	Mysdibule	Mawile	Flunkifer	クチート (Kuchīto) Kucheat
304	304	Galekid	Aron	Stollunior	ココドラ (Kokodora) Cokodora
305	305	Galegon	Lairon	Stollrak	コドラ Kodora
306	306	Galeking	Aggron	Stolloss	ボスゴドラ (Bosugodora) Bossgodora
307	307	Méditikka	Meditite	Meditie	アサナン Asanan
308	308	Charmina	Medicham	Meditalis	チャーレム (Chāremu) Charem
309	309	Dynavolt	Electrike	Frizelbliz	ラクライ Rakurai
310	310	Élecsprint	Manectric	Voltenso	ライボルト (Raiboruto) Livolt
311	311	Posipi	Plusle	Plusle	プラスル (Purasuru) Prasle
312	312	Négapi	Minun	Minun	マイナン (Mainan) Minun
313	313	Muciole	Volbeat	Volbeat	バルビート (Barubīto) Barubeat
314	314	Lumivole	Illumise	Illumise	イルミーゼ (Irumīze) Illumise
315	315	Rosélia	Roselia	Roselia	ロゼリア (Rozeria) Roselia
316	316	Gloupti	Gulpin	Schluppuck	ゴクリン (Gokurin) Gokulin
317	317	Avaltout	Swalot	Schlukwech	マルノーム (Marunōmu) Marunoom
318	318	Carvanha	Carvanha	Kanivanha	キバニア (Kibania) Kibanha
319	319	Sharpedo	Sharpedo	Tohaido	サメハダー (Samehadā) Samehader
320	320	Wailmer	Wailmer	Wailmer	ホエルコ (Hoeruko) Whalko
321	321	Wailord	Wailord	Wailord	ホエルオー (Hoeruō) Whaloh
322	322	Chamallot	Numel	Camaub	ドンメル (Donmeru) Donmel
323	323	Camérupt	Camerupt	Camerupt	バクーダ (Bakūda) Bakuuda
324	324	Chartor	Torkoal	Qurtel	コータス (Kōtasu) Cotoise
325	325	Spoink	Spoink	Spoink	バネブー (Banebū) Baneboo
326	326	Groret	Grumpig	Groink	ブーピッグ (Būpiggu) Boopig
327	327	Spinda	Spinda	Pandir	パッチール (Pacchīru) Patcheel
328	328	Kraknoix	Trapinch	Knacklion	ナックラー (Nakkurā) Nuckrar
329	329	Vibraninf	Vibrava	Vibrava	ビブラーバ (Biburāba) Vibrava
330	330	Libégon	Flygon	Libelldra	フライゴン (Furaigon) Frygon
331	331	Cacnea	Cacnea	Tuska	サボネア Sabonea
332	332	Cacturne	Cacturne	Noktuska	ノクタス (Nokutasu) Noctus
333	333	Tylton	Swablu	Wablu	チルット (Chirutto) Tyltto
334	334	Altaria	Altaria	Altaria	チルタリス (Chirutarisu) Tyltalis
335	335	Mangriff	Zangooze	Sengo	ザングース (Zangūsu) Zangooze
336	336	Séviper	Seviper	Vipitis	ハブネーク (Habunēku) Habunake
337	337	Séléroc	Lunatone	Lunastein	ルナトーン (Runatōn) Lunatone
338	338	Solaroc	Solrock	Sonnfel	ソルロック (Sorurokku) Solrock
339	339	Barloche	Barboach	Schmerbe	ドジョッチ (Dojocchi) Dojoach
340	340	Barbicha	Whiscash	Welsar	ナマズン Namazun
341	341	Écrapince	Corphish	Krebscorps	ヘイガニ Heigani
342	342	Colhomard	Crawdaunt	Krebutack	シザリガー (Shizarigā) Shizariger
343	343	Balbuto	Baltoy	Puppance	ヤジロン (Yajiron) Yajilon
344	344	Kaorine	Claydol	Lepumentas	ネンドール (Nendōru ) Nendoll
345	345	Lilia	Lileep	Liliep	リリーラ (Rirīra) Lilyla
346	346	Vacilys	Cradily	Wielie	ユレイドル (Yureidoru) Yuradle
347	347	Anorith	Anorith	Anorith	アノプス (Anopusu) Anopth
348	348	Armaldo	Armaldo	Armaldo	アーマルド (Āmarudo) Armaldo
349	349	Barpau	Feebas	Barschwa	ヒンバス (Hinbasu) Hinbass
350	350	Milobellus	Milotic	Milotic	ミロカロス (Mirokarosu) Milokaross
351	351	Morphéo	Castform	Formeo	ポワルン (Powarun) Powalen
352	352	Kecleon	Kecleon	Kecleon	カクレオン Kakureon
353	353	Polichombr	Shuppet	Shuppet	カゲボウズ (Kagebōzu) Kagebouzu
354	354	Branette	Banette	Banette	ジュペッタ Jupetta
355	355	Skelénox	Duskull	Zwirrlicht	ヨマワル Yomawaru
356	356	Téraclope	Dusclops	Zwirrklop	サマヨール (Samayōru) Samayouru
357	357	Tropius	Tropius	Tropius	トロピウス (Toropiusu) Tropius
358	358	Éoko	Chimecho	Palimpalim	チリーン (Chirīn) Chirean
359	359	Absol	Absol	Absol	アブソル (Abusoru) Absol
360	360	Okéoké	Wynaut	Isso	ソーナノ (Sōnano) Sohnano
361	361	Stalgamin	Snorunt	Schneppke	ユキワラシ Yukiwarashi
362	362	Oniglali	Glalie	Firnontor	オニゴーリ (Onigōri) Onigohri
363	363	Obalie	Spheal	Seemops	タマザラシ Tamazarashi
364	364	Phogleur	Sealeo	Seejong	トドグラー (Todogurā) Todoggler
365	365	Kaimorse	Walrein	Walraisa	トドゼルガ (Todozeruga) Todoseruga
366	366	Coquiperl	Clamperl	Perlu	パールル (Pāruru) Pearlulu
367	367	Serpang	Huntail	Aalabyss	ハンテール (Hantēru) Huntail
368	368	Rosabyss	Gorebyss	Saganabyss	サクラビス (Sakurabisu) Sakurabyss
369	369	Relicanth	Relicanth	Relicanth	ジーランス (Jīransu) Glanth
370	370	Lovdisc	Luvdisc	Liebiskus	ラブカス (Rabukasu) Lovecus
371	371	Draby	Bagon	Kindwurm	タツベイ (Tatsubei) Tatsubay
372	372	Drackhaus	Shelgon	Draschel	コモルー (Komorū) Komoruu
373	373	Drattak	Salamence	Brutalanda	ボーマンダ (Bōmanda) Bohmander
374	374	Terhal	Beldum	Tanhel	ダンバル (Danbaru) Dumbber
375	375	Métang	Metang	Metang	メタング (Metangu) Metang
376	376	Métalosse	Metagross	Metagross	メタグロス (Metagurosu) Metagross
377	377	Regirock	Regirock	Regirock	レジロック (Rejirokku) Regirock
378	378	Regice	Regice	Regice	レジアイス (Rejiaisu) Regice
379	379	Registeel	Registeel	Registeel	レジスチル (Rejisuchiru) Registeel
380	380	Latias	Latias	Latias	ラティアス (Ratiasu) Latias
381	381	Latios	Latios	Latios	ラティオス (Ratiosu) Latios
382	382	Kyogre	Kyogre	Kyogre	カイオーガ (Kaiōga) Kyogre
383	383	Groudon	Groudon	Groudon	グラードン (Gurādon) Groudon
384	384	Rayquaza	Rayquaza	Rayquaza	レックウザ (Rekkūza) Rayquaza
385	385	Jirachi	Jirachi	Jirachi	ジラーチ (Jirāchi) Jirachi
386	386	Deoxys	Deoxys	Deoxys	デオキシス(Deokishisu) Deoxys
387	387	Tortipouss	Turtwig	Chelast	ナエトル (Naetoru) Naetle
388	388	Boskara	Grotle	Chelcarain	ハヤシガメ Hayashigame
389	389	Torterra	Torterra	Chelterrar	ドダイトス (Dodaitosu) Dodaitose
390	390	Ouisticram	Chimchar	Panflam	ヒコザル Hikozaru
391	391	Chimpenfeu	Monferno	Panpyro	モウカザル (Mōkazaru) Moukazaru
392	392	Simiabraz	Infernape	Panferno	ゴウカザル (Gōkazaru) Goukazaru
393	393	Tiplouf	Piplup	Plinfa	ポッチャマ (Potchama) Pochama
394	394	Prinplouf	Prinplup	Pliprin	ポッタイシ Pottaishi
395	395	Pingoléon	Empoleon	Impoleon	エンペルト (Enperuto) Emperte
396	396	Étourmi	Starly	Staralili	ムックル Mukkuru
397	397	Étourvol	Staravia	Staravia	ムクバード (Mukubādo) Mukubird
398	398	Étouraptor	Staraptor	Staraptor	ムクホーク (Mukuhōku) Mukuhawk
399	399	Keunotor	Bidoof	Bidiza	ビッパ (Bippa) Bipper
400	400	Castorno	Bibarel	Bidifas	ビーダル (Bīdaru) Beadull
401	401	Crikzik	Kricketot	Zirpurze	コロボーシ (Korobōshi) Korobohshi
402	402	Mélokrik	Kricketune	Zirpeise	コロトック (Korotokku) Korotok
403	403	Lixy	Shinx	Sheinux	コリンク (Korinku) Kolink
404	404	Luxio	Luxio	Luxio	ルクシオ (Rukushio) Luxio
405	405	Luxray	Luxray	Luxtra	レントラー (Rentorā) Rentorar
406	406	Rozbouton	Budew	Knospi	スボミー (Subomī) Subomie
407	407	Roserade	Roserade	Roserade	ロズレイド (Rozureido) Roserade
408	408	Kranidos	Cranidos	Koknodon	ズガイドス (Zugaidosu) Zugaidos
409	409	Charkos	Rampardos	Rameidon	ラムパルド (Ramuparudo) Rampard
410	410	Dinoclier	Shieldon	Schilterus	タテトプス (Tatetopusu) Tatetops
411	411	Bastiodon	Bastiodon	Bollterus	トリテプス (Toridepusu) Trideps
412	412	Cheniti	Burmy	Burmy	ミノムッチ (Minomutchi) Minomucchi
413	413	Cheniselle	Wormadam	Burmadame	ミノマダム (Minomadamu) Minomadam
414	414	Papilord	Mothim	Moterpel	ガーメイル (Gāmeiru) Garmeil
415	415	Apitrini	Combee	Wadribie	ミツハニー (Mitsuhanī) Mitsuhoney
416	416	Apireine	Vespiqueen	Honweisel	ビークイン (Bīkuin) Beequeen
417	417	Pachirisu	Pachirisu	Pachirisu	パチリス Pachirisu
418	418	Mustébouée	Buizel	Bamelin	ブイゼル (Buizeru) Buoysel
419	419	Mustéflott	Floatzel	Bojelin	フローゼル (Furōzeru) Flowsel
420	420	Ceribou	Cherubi	Kikugi	チェリンボ Cherinbo
421	421	Ceriflor	Cherrim	Kinoso	チェリム (Cherimu) Cherrim
422	422	Sancoki	Shellos	Schalellos	カラナクシ Karanakushi
423	423	Tritosor	Gastrodon	Gastrodon	トリトドン Toritodon
424	424	Capidextre	Ambipom	Ambidiffel	エテボース (Etebōsu) Eteboth
425	425	Baudrive	Drifloon	Driftlon	フワンテ Fuwante
426	426	Grodrive	Drifblim	Drifzepeli	フワライド (Fuwaraido) Fuwaride
427	427	Laporeille	Buneary	Haspiror	ミミロル (Mimiroru) Mimirol
428	428	Lockpin	Lopunny	Schlapor	ミミロップ (Mimiroppu) Mimilop
429	429	Magirêve	Mismagius	Traunmagil	ムウマージ (Mūmāji) Mumage
430	430	Corboss	Honchkrow	Kramshef	ドンカラス Donkarasu
431	431	Chaglam	Glameow	Charmian	ニャルマー (Nyarumā) Nyarmar
432	432	Chaffreux	Purugly	Shnurgarst	ブニャット (Bunyatto) Bunyat
433	433	Korillon	Chingling	Klingplim	リーシャン (Rīshan) Lisyan
434	434	Moufouette	Stunky	Skunkapuh	スカンプー (Sukanpū) Skunpoo
435	435	Moufflair	Skuntank	Skuntank	スカタンク (Sukatanku) Skutank
436	436	Archéomire	Bronzor	Bronzel	ドーミラー (Dōmirā) Domirror
437	437	Archéodong	Bronzong	Bronzong	ドータクン (Dōtakun) Dotakun
438	438	Manzaï	Bonsly	Mobai	ウソハチ Usohachi
439	439	Mime Jr.	Mime Jr.	Pantimimi	マネネ Manene
440	440	Ptiravi	Happiny	Wonneira	ピンプク Pinpuku
441	441	Pijako	Chatot	Plaudagei	ペラップ (Perappu) Perap
442	442	Spiritomb	Spiritomb	Kryppuk	ミカルゲ Mikaruge
443	443	Griknot	Gible	Kaumalat	フカマル Fukamaru
444	444	Carmache	Gabite	Knarksel	ガバイト (Gabaito) Gabite
445	445	Carchacrok	Garchomp	Knakrack	ガブリアス (Gaburiasu) Gablias
446	446	Goinfrex	Munchlax	Mampfaxo	ゴンベ Gonbe
447	447	Riolu	Riolu	Riolu	リオル (Rioru) Riolu
448	448	Lucario	Lucario	Lucario	ルカリオ (Rukario) Lucario
449	449	Hippopotas	Hippopotas	Hippopotas	ヒポポタス (Hipopotasu) Hipopotas
450	450	Hippodocus	Hippowdon	Hippoterus	カバルドン Kabarudon
451	451	Rapion	Skorupi	Pionskora	スコルピ (Sukorupi) Scorpi
452	452	Drascore	Drapion	Piondragi	ドラピオン Dorapion
453	453	Cradopaud	Croagunk	Glibunkel	グレッグル (Guregguru) Gureggru
454	454	Coatox	Toxicroak	Toxiquak	ドクロッグ (Dokuroggu) Dokurog
455	455	Vortente	Carnivine	Venuflibis	マスキッパ (Masukippa) Muskippa
456	456	Écayon	Finneon	Finneon	ケイコウオ Keikouo
457	457	Luminéon	Lumineon	Lumineon	ネオラント (Neoranto) Neolant
458	458	Babimanta	Mantyke	Mantirps	タマンタ Tamanta
459	459	Blizzi	Snover	Shnebedeck	ユキカブリ Yukikaburi
460	460	Blizzaroi	Abonasnow	Rexblisar	ユキノオー (Yukinoō) Yukinooh
461	461	Dimoret	Weavile	Snibunna	マニューラ (Manyūra) Manyula
462	462	Magnézone	Magnezone	Magnezone	ジバコイル (Jibakoiru) Jibacoil
463	463	Coudlangue	Lickilicky	Schlurplek	ベロベルト (Beroberuto) Beroberto
464	464	Rhinastoc	Rhyperior	Rihornior	ドサイドン (Dosaidon) Dosydon
465	465	Bouldeneu	Tangrowth	Tangoloss	モジャンボ (Mojanbo) Mojumbo
466	466	Élekable	Electivire	Elevoltek	エレキブル (Erekiburu) Elekible
467	467	Maganon	Magmortar	Magbrant	ブーバーン (Būbān) Booburn
468	468	Togekiss	Togekiss	Togekiss	トゲキッス (Togekissu) Togekiss
469	469	Yanméga	Yanmega	Yanmega	メガヤンマ Megayanma
470	470	Phyllali	Leafeon	Folipurba	リーフィア (Rīfia) Leafia
471	471	Givrali	Glaceon	Glaziola	グレイシア (Gureishia ) Glacia
472	472	Scorvol	Gliscor	Skorgro	グライオン (Guraion) Glion
473	473	Mammochon	Mamoswine	Mamutel	マンムー (Manmū) Mammoo
474	474	Porygon-Z	Porygon-Z	Porygon-Z	ポリゴンZ (PorigonZ) PorygonZ
475	475	Gallame	Gallade	Galagladi	エルレイド (Erureido) Erlade
476	476	Tarinorme	Probopass	Voluminas	ダイノーズ (Dainōzu) Dainose
477	477	Noctunoir	Dusknoir	Zwirrfinst	ヨノワール (Yonowāru) Yonoir
478	478	Momartik	Froslass	Frosdedje	ユキメノコ Yukimenoko
479	479	Motisma	Rotom	Rotom	ロトム (Rotomu) Rotom
480	480	Créhelf	Uxie	Selfe	ユクシー (Yukushī) Yuxie
481	481	Créfollet	Mesprit	Vesprit	エムリット (Emuritto) Emrit
482	482	Créfadet	Azelf	Tobutz	アグノム (Agunomu) Agnome
483	483	Dialga	Dialga	Dialga	ディアルガ (Diaruga) Dialga
484	484	Palkia	Palkia	Palkia	パルキア (Parukia) Palkia
485	485	Heatran	Heatran	Heatran	ヒードラン (Hīdoran) Heatran
486	486	Regigigas	Regigigas	Regigigas	レジギガス (Rejigigasu) Regigigas
487	487	Giratina	Giratina	Giratina	ギラティナ Giratina
488	488	Cresselia	Cresselia	Cresselia	クレセリア (Kureseria) Crecelia
489	489	Phione	Phione	Phione	フィオネ (Fione) Phione
490	490	Manaphy	Manaphy	Manaphy	マナフィ (Manafi) Manaphy
491	491	Darkrai	Darkrai	Darkrai	ダークライ (Dākurai) Darkrai
492	492	Shaymin	Shaymin	Shaymin	シェイミ (Sheimi) Shaymin
493	493	Arceus	Arceus	Arceus	アルセウス (Aruseusu) Arceus
494	494	Victini	Victini	Victini	ビクティニ (Bikutini) Victini
495	495	Vipélierre	Snivy	Serpifeu	ツタージャ (Tsutāja) Tsutarja
496	496	Lianaja	Servine	Efoserp	ジャノビー (Janobī) Janovy
497	497	Majaspic	Serperior	Serpiroyal	ジャローダ (Jarōda) Jalorda
498	498	Gruikui	Tepig	Floink	ポカブ Pokabu
499	499	Grotichon	Pignite	Ferkokel	チャオブー (Chaobū) Chaoboo
500	500	Roitiflam	Emboar	Flambirex	エンブオー (Enbuo) Enbuoh
501	501	Moustillon	Oshawott	Ottaro	ミジュマル Mijumaru
502	502	Mateloutre	Dewott	Zwottronin	フタチマル Futachimaru
503	503	Clamiral	Samurott	Admurai	ダイケンキ Daikenki
504	504	Ratentif	Patrat	Nagelotz	ミネズミ Minezumi
505	505	Miradar	Watchog	Kukmarda	ミルホッグ (Miruhoggu) Miruhog
506	506	Ponchiot	Lillipup	Yorkleff	ヨーテリー (Yōterī) Yorterrie
507	507	Ponchien	Herdier	Terribark	ハーデリア (Hāderia) Herderrie
508	508	Mastouffe	Stoutland	Bissbark	ムーランド (Mūrando) Mooland
509	509	Chacripan	Purrloin	Felilou	チョロネコ Choroneko
510	510	Léopardus	Liepard	Kleoparda	レパルダス (Leperasudu) Lepardas
511	511	Feuillajou	Pansage	Vegimak	ヤナップ Yanappu
512	512	Feuiloutan	Simisage	Vegichita	ヤナッキー (Yanakkī) Yanakkie
513	513	Flamajou	Pansear	Grillmak	バオップ Baoppu
514	514	Flamoutan	Simisear	Grillchita	バオッキー (Baokkī) Baokkie
515	515	Flotajou	Panpour	Sodamak	ヒヤップ Hiyappu
516	516	Flotoutan	Simipour	Sodachita	ヒヤッキー (Hiyakkī) Hiyakkie
517	517	Munna	Munna	Somniam	ムンナ Munna
518	518	Mushana	Musharna	Somnivora	ムシャーナ (Mushāna) Musharna
519	519	Poichigeon	Pidove	Dusselgurr	マメパト Mamepato
520	520	Colombeau	Tranquill	Navitaub	ハトーボー (Hatōbō) Hatooboo
521	521	Déflaisan	Unfezant	Fasasnob	ケンホロウ (Kenhorō) Kenhorou
522	522	Zébibron	Blitzle	Elezeba	シママ Shimama
523	523	Zéblitz	Zebstrika	Zebritz	ゼブライカ (Zebraika) Zeburaika
524	524	Nodulithe	Roggenrola	Kiesling	ダンゴロ Dangoro
525	525	Géolithe	Boldore	Sedimantur	ガントル (Gantle) Gantoru
526	526	Gigalithe	Gigalith	Brockoloss	ギガイアス (Gigaiasu) Gigaiath
527	527	Chovsourir	Woobat	Fleknoil	コロモリ Koromori
528	528	Rhinolove	Swoobat	Fletiamo	ココロモリ Kokoromori
529	529	Rototaupe	Drilbur	Rotomurf	モグリュー (Moguryū) Mogurew
530	530	Minotaupe	Excadrill	Stalobor	ドリュウズ (Doryūzu) Doryuzu
531	531	Nanméouïe	Audino	Ohrdoch	タブンネ Tabunne
532	532	Charpenti	Timburr	Praktibalk	ドッコラー (Dokkorā) Dokkorer
533	533	Ouvrifier	Gurdurr	Strepoli	ドテッコツ Dotekkotsu
534	534	Bétochef	Conkeldurr	Meistagrif	ローブシン (Rōbushin) Roobushin
535	535	Tritonde	Tympole	Schallquap	オタマロ Otamaro
536	536	Batracné	Palpitoad	Mebrana	ガマガル Gamagaru
537	537	Crapustule	Seismitoad	Branawarz	ガマゲロゲ Gamageroge
538	538	Judokrak	Throh	Jiutesto	ナゲキ Nageki
539	539	Karaclée	Sawk	Karadonis	ダゲキ Dageki
540	540	Larveyette	Sewaddle	Strawickl	クルミル Kurumiru
541	541	Couverdure	Swadloon	Folikon	クルマユ Kurumayu
542	542	Manternel	Leavanny	Matrifol	ハハコモリ Hahakomori
543	543	Venipatte	Venipede	Toxiped	フシデ Fushide
544	544	Scobolide	Whirlipede	Rollum	ホイーガ (Hoīga) Wheega
545	545	Brutapode	Scolipede	Cerapendra	ペンドラー (Pendorā) Pendra
546	546	Doudouvet	Cottonee	Waumboll	モンメン Monmen
547	547	Farfaduvet	Whimsicott	Elfun	エルフーン (Erufūn) Elfuun
548	548	Chlorobule	Petilil	Lilminip	チュリネ Churine
549	549	Fragilady	Lilligant	Dressella	ドレディア (Doredia) Doredia
550	550	Bargantua	Basculin	Barschuft	バスラオ (Basurao) Basurao
551	551	Mascaïman	Sandile	Ganovil	メグロコ (Meguroko) Meguroco
552	552	Escroco	Krokorok	Rokkaiman	ワルビル (Warubiru) Waruvile
553	553	Crocorible	Krookodile	Rabigator	ワルビアル (Warubiaru) Waruvial
554	554	Darumarond	Darumaka	Flampion	ダルマッカ Darumakka
555	555	Darumacho	Darmanitan	Flampivian	ヒヒダルマ Hihidaruma
556	556	Maracachi	Maractus	Maracamba	マラカッチ (Marakacchi) Marakacchi
557	557	Crabicoque	Dwebble	Lithomith	イシズマイ Ishizumai
558	558	Crabaraque	Crustle	Castellith	イワパレス (Iwaparesu) Iwapalace
559	559	Baggiguane	Scraggy	Zurrokex	ズルッグ Zuruggu
560	560	Baggaïd	Scrafty	Irokex	ズルズキン Zuruzukin
561	561	Cryptéro	Sigilyph	Symvolara	シンボラー (Shinborā) Shinbora
562	562	Tutafeh	Yamask	Makabaja	デスマス Desumasu
563	563	Tutankafer	Cofagrigus	Echnatoll	デスカーン (Desukān) Desukarn
564	564	Carapagos	Tirtouga	Galapaflos	プロトーガ Purotoga
565	565	Mégapagos	Carracosta	Karippas	アバゴーラ Abagoura
566	566	Arkéapti	Archen	Flapteryx	アーケン (Āken) Archen
567	567	Aéroptéryx	Archeops	Aeropteryx	アーケオス (Ākeosu) Archeos
568	568	Miamiasme	Trubbish	Unratütox	ヤブクロン Yabukuron
569	569	Miasmax	Garbodor	Deponitox	ダストダス (Dasutodasu) Dustdas
570	570	Zorua	Zorua	Zorua	ゾロア (Zoroa) Zorua
571	571	Zoroark	Zoroark	Zoroark	ゾロアーク (Zoroāku) Zoroark
572	572	Chinchidou	Minccino	Picochilla	チラーミィ (Chirāmyi) Chillarmy
573	573	Pashmilla	Cinccino	Chillabell	チラチーノ (Chirachīno) Chillaccino
574	574	Scrutella	Gothita	Mollimorba	ゴチム (Gochimu) Gothimu
575	575	Mesmérella	Gothorita	Hypnomorba	ゴチミル (Gothimiru) Gochimiru
576	576	Sidérella	Gothitelle	Morbitesse	ゴチルゼル (Gochiruzeru) Gothiruselle
577	577	Nucléos	Solosis	Monozyto	ユニラン (Yuniran) Uniran
578	578	Méios	Duosion	Mitodos	ダブラン (Daburan) Doublan
579	579	Symbios	Reuniclus	Zytomega	ランクルス (Rankurusu) Lanculus
580	580	Couaneton	Ducklett	Piccolente	コアルヒー (Koaruhī) Koaruhie
581	581	Lakmécygne	Swanna	Swaroness	スワンナ (Suwanna) Swanna
582	582	Sorbébé	Vanillite	Gelatini	バニプッチ (Banipucchi) Vanipeti
583	583	Sorboul	Vanillish	Gelatroppo	バニリッチ (Baniricchi) Vanirich
584	584	Sorbouboul	Vanilluxe	Gelatwino	バイバニラ (Baibanira) Baivanilla
585	585	Vivaldaim	Deerling	Sesokitz	シキジカ Shikijika
586	586	Haydaim	Sawsbuck	Kronjuwild	メブキジカ Mebukijika
587	587	Emolga	Emolga	Emolga	エモンガ Emonga
588	588	Carabing	Karrablast	Laukaps	カブルモ Kaburumo
589	589	Lançargot	Escavalier	Cavalanzas	シュバルゴ (Shubarugo) Chevargo
590	590	Trompignon	Foongus	Tarnpignon	タマゲタケ Tamagetake
591	591	Gaulet	Amoonguss	Hutsassa	モロバレル Morobareru
592	592	Viskuse	Frillish	Quabbel	プルリル (Pururiru) Pururill
593	593	Moyade	Jellicent	Apoquallyp	ブルンゲル (Burungeru) Burungel
594	594	Mamanbo	Alomomola	Mamolida	ママンボウ Mamanbou
595	595	Statitik	Joltik	Wattzapf	バチュル Bachuru
596	596	Mygavolt	Galvantula	Voltula	デンチュラ (Denchura) Dentula
597	597	Grindur	Ferroseed	Kastadur	テッシード (Tesshīdo) Tesseed
598	598	Noacier	Ferrothorn	Tentantel	ナットレイ (Nattorei) Nutrey
599	599	Tic	Klink	Klikk	ギアル (Giaru) Gear
600	600	Clic	Klang	Kliklak	ギギアル (Gigiaru) Gigear
601	601	Cliticlic	Klinklang	Klikdiklak	ギギギアル (Gigigiaru) Gigigear
602	602	Anchwatt	Tynamo	Zapplardin	シビシラス Shibishirasu
603	603	Lampéroie	Eelektrik	Zapplalek	シビビール (Shibibīru) Shibibeel
604	604	Ohmassacre	Eelektross	Zapplarang	シビルドン Shibirudon
605	605	Lewsor	Elgyem	Pygraulon	リグレー (Rigurē) Ligray
606	606	Neitram	Beheeyem	Megalon	オーベム (Ōbemu) Ohbem
607	607	Funécire	Litwick	Lichtel	ヒトモシ Hitomoshi
608	608	Mélancolux	Lampent	Laternecto	ランプラー (Ranpurā) Lampler
609	609	Lugulabre	Chandelure	Skelabra	シャンデラ (Shandera) Chandela
610	610	Coupenotte	Axew	Milza	キバゴ Kibago
611	611	Incisache	Fraxure	Sharfax	オノンド Onondo
612	612	Tranchodon	Haxorus	Maxax	オノノクス (Ononokusu) Ononokus
613	613	Polarhume	Cubchoo	Petznief	クマシュン (Kumashun) Kumasyun
614	614	Polagriffe	Beartic	Siberio	ツンベアー (Tsunbeā) Tunbear
615	615	Hexagel	Cryogonal	Frigometri	フリージオ (Furījio) Freegeo
616	616	Escargaume	Shelmet	Schnuthelm	チョボマキ Chobomaki
617	617	Limaspeed	Accelgor	Hydragil	アギルダー (Agirudā) Agilder
618	618	Limonde	Stunfisk	Flunschlik	マッギョ Maggyo
619	619	Kungfouine	Mienfoo	Lin-Fu	コジョフー (Kojofū) Kojofu
620	620	Shaofouine	Mienshao	Wie-Shu	コジョンド Kojondo
621	621	Drakkarmin	Druddigon	Shardrago	クリムガン (Kurimugan) Crimgan
622	622	Gringolem	Golett	Golbit	ゴビット (Gobitto) Gobit
623	623	Golemastoc	Golurk	Golgantes	ゴルーグ (Goruggo) Goloog
624	624	Scalpion	Pawniard	Gladiantri	コマタナ Komatana
625	625	Scalproie	Bisharp	Caesurio	キリキザン Kirikizan
626	626	Frison	Bouffalant	Bisofank	バッフロン (Baffuron) Buffron
627	627	Furaiglon	Rufflet	Geronimatz	ワシボン Washibon
628	628	Gueriaigle	Braviary	Washakwil	ウォーグル (Wōguru) Warggle
629	629	Vostourno	Vullaby	Skallyk	バルチャイ (Baruchai) Valchai
630	630	Vaututrice	Mandibuzz	Grypheldis	バルジーナ (Barujīna) Vulgina
631	631	Aflamanoir	Heatmor	Furnifrass	クイタラン Kuitaran
632	632	Fermite	Durant	Fermicula	アイアント (Aianto) Aiant
633	633	Solochi	Deino	Kapuno	モノズ Monozu
634	634	Diamat	Zweilous	Duodino	ジヘッド (Jiheddo) Dihead
635	635	Trioxhydre	Hydreigon	Trikephalo	サザンドラ Sazandora
636	636	Pyronille	Larvesta	Ignivor	メラルバ (Meraruba) Merlarva
637	637	Pyrax	Volcarona	Ramoth	ウルガモス (Urugamosu) Ulgamoth
638	638	Cobaltium	Cobalion	Kobalium	コバルオン (Kobaruon) Cobalon
639	639	Terrakium	Terrakion	Terrakium	テラキオン (Terakion) Terrakion
640	640	Viridium	Virizion	Viridium	ビリジオン (Birijion) Virizion
641	641	Boréas	Tornadus	Boreos	トルネロス (Torunerosu) Tornelos
642	642	Fulguris	Thundurus	Voltolos	ボルトロス Voltolos
643	643	Reshiram	Reshiram	Reshiram	レシラム (Reshiramu) Reshiram
644	644	Zekrom	Zekrom	Zekrom	ゼクロム (Zekuromu) Zekrom
645	645	Démétéros	Landorus	Demeteros	ランドロス (Randorosu) Landlos
646	646	Kyurem	Kyurem	Kyurem	キュレム (Kyuremu) Kyurem
647	647	Keldeo	Keldeo	Keldeo	ケルディオ (Kerudio) Keldeo
648	648	Meloetta	Meloetta	Meloetta	メロエッタ (Meroetta) Meloetta
649	649	Genesect	Genesect	Genesect	ゲノセクト (Genosekuto) Genesect
650	650	Marisson	Chespin	Igamaro	ハリマロン Harimaron
651	651	Boguérisse	Quilladin	Igastanish	ハリボーグ (Haribōgu) Hariborg
652	652	Blindépique	Chesnaught	Brigaron	ブリガロン (Burigaron) Brigarron
653	653	Feunnec	Fennekin	Fynx	フォッコ Fokko
654	654	Roussil	Braxien	Rutena	テールナー (Tērunā) Tairenar
655	655	Goupelin	Delphox	Fennexis	マフォクシー (Mafokushī) Mahoxy
656	656	Grenousse	Froakie	Froxy	ケロマツ Keromatsu
657	657	Croâporal	Frogadier	Amphizel	ゲロガシラ (Gekogashira) Gekogahshier
658	658	Amphinobi	Greninja	Quajutsu	ゲッコウガ (Gekkōga) Gekkouga
659	659	Sapereau	Bunnelby	Scoppel	ホルビー Horubī
660	660	Excavarenne	Diggersby	Grebbit	ホルード Horūdo
661	661	Passerouge	Fletchling	Dartiri	ヤヤコマ Yayakoma
662	662	Braisillon	Fletchinder	Dartignis	ヒノヤコマ Hinoyakoma
663	663	Flambusard	Talonflame	Fiaro	ファイアロー (Faiarō) Fiarrow
664	664	Lépidonille	Scatterbug	Purmel	コフキムシ Kofukimushi
665	665	Pérégrain	Spewpa	Puponcho	コフーライ Kofūrai
666	666	Prismillon	Vivillon	Vivillon	ビビヨン (Bibiyon) Viviyon
667	667	Hélionceau	Litleo	Leufeo	シシコ Shishiko
668	668	Némélios	Pyroar	Pyroleo	カエンジシ Kaenjishi
669	669	Flabébé	Flabébé	Flabébé	フラベベ (Furabebe) Flabebe
670	670	Floette	Floette	Floette	フラエッテ (Furaette) Flaette
671	671	Florges	Florges	Florges	フラージェス (Furājesu) Florges
672	672	Cabriolaine	Skiddo	Mähikel	メエークル (Meēkuru) Me'ēkuru
673	673	Chevroum	Gogoat	Chevrumm	ゴーゴート (Gōgōto) Gogoat
674	674	Pandespiègle	Pancham	Pam-Pam	ヤンチャム (Yanchamu) Yancham
675	675	Pandarbare	Pangoro	Pandagro	ゴロンダ Goronda
676	676	Couafarel	Furfrou	Coiffwaff	トリミアン (Torimian) Trimmien
677	677	Psystigri	Espurr	Psiau	ニャスパー (Nyasupā) Nyasper
678	678	Mistigrix	Meowstic	Psiaugon	ニャオニクス (Nyaonikusu) Nyaonix
679	679	Monorpale	Honedge	Gramokles	ヒトツキ Hitotsuki
680	680	Dimoclès	Doublade	Duokles	ニダンギル Nidangiru
681	681	Exagide	Aegislash	Durengard	ギルガルド Girugarudo
682	682	Fluvetin	Spritzee	Parfi	シュシュプ Shushupu
683	683	Cocotine	Aromatisse	Parfinesse	フレフワン (Furefuran) Frefuwan
684	684	Sucroquin	Swirlix	Flauschling	ペロッパフ Peroppafu
685	685	Cupcanaille	Slurpuff	Sabbaione	ペロリーム (Perorīmu) Peroream
686	686	Sepiatop	Inkay	Iscalar	マーイーカ (Māīka) Maaiika
687	687	Sepiatroce	Malamar	Calamanero	カラマネロ (Karamanero) Calamanero
688	688	Opermine	Binacle	Bithora	カメテテ Kametete
689	689	Golgopathe	Barbaracle	Thanathora	ガメノデス Gamenodesu
690	690	Venalgue	Skrelp	Algitt	クズモー (Kuzumō) Kuzumou
691	691	Kravarech	Dragalge	Tandrak	ドラミドロ (Doramidoro) Dramidoro
692	692	Flingouste	Clauncher	Scampisto	ウデッポウ (Udeppō) Udeppou
693	693	Gamblast	Clawitzer	Wummer	ブロスター (Burosutā) Bloster
694	694	Galvaran	Helioptile	Eguana	エリキテル Erikiteru
695	695	Iguolta	Heliolisk	Elezard	エレザード (Erezādo) Elezard
696	696	Ptyranidur	Tyrunt	Balgoras	チゴラス (Chigorasu) Chigoras
697	697	Rexillius	Tyrantrum	Monargoras	ガチゴラス (Gachigorasu) Gachigoras
698	698	Amagara	Amaura	Amarino	アマルス (Amarusu) Amarus
699	699	Dragmara	Aurorus	Amagarga	アマルルガ (Amaruruga) Amaruruga
700	700	Nymphali	Sylveon	Feelinara	ニンフィア (Ninfia) Nymphia
701	701	Brutalibré	Hawlucha	Resladero	ルチャブル (Ruchaburu) Luchabull
702	702	Dedenne	Dedenne	Dedenne	デデンネ Dedenne
703	703	Strassie	Carbink	Rocara	メレシー (Meresī) Melecie
704	704	Mucuscule	Goomy	Viscora	ヌメラ Numera
705	705	Colimucus	Sliggoo	Viscargot	ヌメイル (Numeiru) Numeil
706	706	Muplodocus	Goodra	Viscogon	ヌメルゴン Numerugon
707	707	Trousselin	Klefki	Clavion	クレッフィ (Kureffi) Cleffy
708	708	Brocélôme	Phantump	Paragoni	ボクレー (Bokurē) Bokurei
709	709	Desséliande	Trevenant	Trombork	オーロット (Ōrotto) Ohrot
710	710	Pitrouille	Pumpkaboo	Irrbis	バケッチャ (Bakecchya) Baketcha
711	711	Banshitrouye	Gourgeist	Pumpdjinn	パンプシン (Panpujin) Pumpjin
712	712	Grelaçon	Bergmite	Arktip	カチコール Kachikōru
713	713	Séracrawl	Avalugg	Arktilas	クレベース (Kurebēsu) Crebase
714	714	Sonistrelle	Noibat	eF-eM	オンバット (Onbatto) Onbat
715	715	Bruyverne	Noivern	UHaFnir	オンバーン (Onbān) Onvern
716	716	Xerneas	Xerneas	Xerneas	ゼルネアス (Zeruneasu) Xerneas
717	717	Yveltal	Yveltal	Yveltal	イベルタル (Yberutaru) Yveltal
718	718	Zygarde	Zygarde	Zygarde	ジガルデ (Jigarude) Zygarde
719	719	Diancie	Diancie	Diancie	ディアンシー (Dianshī) Diancie
720	720	Hoopa	Hoopa	Hoopa	フーパ (Fūpa) Hoopa*/}.toString().slice(14,-3);

return all;
}

function getGenI()
{
var all = function(){/*001	Bulbasaur	フシギダネ	Grass	Poison	001
002	Ivysaur	フシギソウ	Grass	Poison	002
003	Venusaur	フシギバナ	Grass	Poison	003
004	Charmander	ヒトカゲ	Fire	none	004
005	Charmeleon	リザード	Fire	none	005
006	Charizard	リザードン	Fire	Flying	006
007	Squirtle	ゼニガメ	Water	none	007
008	Wartortle	カメール	Water	none	008
009	Blastoise	カメックス	Water	none	009
010	Caterpie	キャタピー	Bug	none	010
011	Metapod	トランセル	Bug	none	011
012	Butterfree	バタフリー	Bug	Flying	012
013	Weedle	ビードル	Bug	Poison	013
014	Kakuna	コクーン	Bug	Poison	014
015	Beedrill	スピアー	Bug	Poison	015
016	Pidgey	ポッポ	Normal	Flying	016
017	Pidgeotto	ピジョン	Normal	Flying	017
018	Pidgeot	ピジョット	Normal	Flying	018
019	Rattata	コラッタ	Normal	none	019
020	Raticate	ラッタ	Normal	none	020
021	Spearow	オニスズメ	Normal	Flying	021
022	Fearow	オニドリル	Normal	Flying	022
023	Ekans	アーボ	Poison	none	023
024	Arbok	アーボック	Poison	none	024
025	Pikachu	ピカチュウ	Electric	none	025
026	Raichu	ライチュウ	Electric	none	026
027	Sandshrew	サンド	Ground	none	027
028	Sandslash	サンドパン	Ground	none	028
029	Nidoran♀	ニドラン♀	Poison	none	029
030	Nidorina	ニドリーナ	Poison	none	030
031	Nidoqueen	ニドクイン	Poison	Ground	031
032	Nidoran♂	ニドラン♂	Poison	none	032
033	Nidorino	ニドリーノ	Poison	none	033
034	Nidoking	ニドキング	Poison	Ground	034
035	Clefairy	ピッピ	Fairy	none	035
036	Clefable	ピクシー	Fairy	none	036
037	Vulpix	ロコン	Fire	none	037
038	Ninetales	キュウコン	Fire	none	038
039	Jigglypuff	プリン	Normal	Fairy	039
040	Wigglytuff	プクリン	Normal	Fairy	040
041	Zubat	ズバット	Poison	Flying	041
042	Golbat	ゴルバット	Poison	Flying	042
043	Oddish	ナゾノクサ	Grass	Poison	043
044	Gloom	クサイハナ	Grass	Poison	044
045	Vileplume	ラフレシア	Grass	Poison	045
046	Paras	パラス	Bug	Grass	046
047	Parasect	パラセクト	Bug	Grass	047
048	Venonat	コンパン	Bug	Poison	048
049	Venomoth	モルフォン	Bug	Poison	049
050	Diglett	ディグダ	Ground	none	050
051	Dugtrio	ダグトリオ	Ground	none	051
052	Meowth	ニャース	Normal	none	052
053	Persian	ペルシアン	Normal	none	053
054	Psyduck	コダック	Water	none	054
055	Golduck	ゴルダック	Water	none	055
056	Mankey	マンキー	Fighting	none	056
057	Primeape	オコリザル	Fighting	none	057
058	Growlithe	ガーディ	Fire	none	058
059	Arcanine	ウインディ	Fire	none	059
060	Poliwag	ニョロモ	Water	none	060
061	Poliwhirl	ニョロゾ	Water	none	061
062	Poliwrath	ニョロボ	Water	Fighting	062
063	Abra	ケーシィ	Psychic	none	063
064	Kadabra	ユンゲラー	Psychic	none	064
065	Alakazam	フーディン	Psychic	none	065
066	Machop	ワンリキー	Fighting	none	066
067	Machoke	ゴーリキー	Fighting	none	067
068	Machamp	カイリキー	Fighting	none	068
069	Bellsprout	マダツボミ	Grass	Poison	069
070	Weepinbell	ウツドン	Grass	Poison	070
071	Victreebel	ウツボット	Grass	Poison	071
072	Tentacool	メノクラゲ	Water	Poison	072
073	Tentacruel	ドククラゲ	Water	Poison	073
074	Geodude	イシツブテ	Rock	Ground	074
075	Graveler	ゴローン	Rock	Ground	075
076	Golem	ゴローニャ	Rock	Ground	076
077	Ponyta	ポニータ	Fire	none	077
078	Rapidash	ギャロップ	Fire	none	078
079	Slowpoke	ヤドン	Water	Psychic	079
080	Slowbro	ヤドラン	Water	Psychic	080
081	Magnemite	コイル	Electric	Steel	081
082	Magneton	レアコイル	Electric	Steel	082
083	Farfetch'd	カモネギ	Normal	Flying	083
084	Doduo	ドードー	Normal	Flying	084
085	Dodrio	ドードリオ	Normal	Flying	085
086	Seel	パウワウ	Water	none	086
087	Dewgong	ジュゴン	Water	Ice	087
088	Grimer	ベトベター	Poison	none	088
089	Muk	ベトベトン	Poison	none	089
090	Shellder	シェルダー	Water	none	090
091	Cloyster	パルシェン	Water	Ice	091
092	Gastly	ゴース	Ghost	Poison	092
093	Haunter	ゴースト	Ghost	Poison	093
094	Gengar	ゲンガー	Ghost	Poison	094
095	Onix	イワーク	Rock	Ground	095
096	Drowzee	スリープ	Psychic	none	096
097	Hypno	スリーパー	Psychic	none	097
098	Krabby	クラブ	Water	none	098
099	Kingler	キングラー	Water	none	099
100	Voltorb	ビリリダマ	Electric	none	100
101	Electrode	マルマイン	Electric	none	101
102	Exeggcute	タマタマ	Grass	Psychic	102
103	Exeggutor	ナッシー	Grass	Psychic	103
104	Cubone	カラカラ	Ground	none	104
105	Marowak	ガラガラ	Ground	none	105
106	Hitmonlee	サワムラー	Fighting	none	106
107	Hitmonchan	エビワラー	Fighting	none	107
108	Lickitung	ベロリンガ	Normal	none	108
109	Koffing	ドガース	Poison	none	109
110	Weezing	マタドガス	Poison	none	110
111	Rhyhorn	サイホーン	Ground	Rock	111
112	Rhydon	サイドン	Ground	Rock	112
113	Chansey	ラッキー	Normal	none	113
114	Tangela	モンジャラ	Grass	none	114
115	Kangaskhan	ガルーラ	Normal	none	115
116	Horsea	タッツー	Water	none	116
117	Seadra	シードラ	Water	none	117
118	Goldeen	トサキント	Water	none	118
119	Seaking	アズマオウ	Water	none	119
120	Staryu	ヒトデマン	Water	none	120
121	Starmie	スターミー	Water	Psychic	121
122	Mr. Mime	バリヤード	Psychic	Fairy	122
123	Scyther	ストライク	Bug	Flying	123
124	Jynx	ルージュラ	Ice	Psychic	124
125	Electabuzz	エレブー	Electric	none	125
126	Magmar	ブーバー	Fire	none	126
127	Pinsir	カイロス	Bug	none	127
128	Tauros	ケンタロス	Normal	none	128
129	Magikarp	コイキング	Water	none	129
130	Gyarados	ギャラドス	Water	Flying	130
131	Lapras	ラプラス	Water	Ice	131
132	Ditto	メタモン	Normal	none	132
133	Eevee	イーブイ	Normal	none	133
134	Vaporeon	シャワーズ	Water	none	134
135	Jolteon	サンダース	Electric	none	135
136	Flareon	ブースター	Fire	none	136
137	Porygon	ポリゴン	Normal	none	137
138	Omanyte	オムナイト	Rock	Water	138
139	Omastar	オムスター	Rock	Water	139
140	Kabuto	カブト	Rock	Water	140
141	Kabutops	カブトプス	Rock	Water	141
142	Aerodactyl	プテラ	Rock	Flying	142
143	Snorlax	カビゴン	Normal	none	143
144	Articuno	フリーザー	Ice	Flying	144
145	Zapdos	サンダー	Electric	Flying	145
146	Moltres	ファイヤー	Fire	Flying	146
147	Dratini	ミニリュウ	Dragon	none	147
148	Dragonair	ハクリュー	Dragon	none	148
149	Dragonite	カイリュー	Dragon	Flying	149
150	Mewtwo	ミュウツー	Psychic	none	150
151	Mew	ミュウ	Psychic	none	151*/}.toString().slice(14,-3);

return all;
}

function getGenII()
{
var all = function(){/*
152	Chikorita	チコリータ	Grass	none	152
153	Bayleef	ベイリーフ	Grass	none	153
154	Meganium	メガニウム	Grass	none	154
155	Cyndaquil	ヒノアラシ	Fire	none	155
156	Quilava	マグマラシ	Fire	none	156
157	Typhlosion	バクフーン	Fire	none	157
158	Totodile	ワニノコ	Water	none	158
159	Croconaw	アリゲイツ	Water	none	159
160	Feraligatr	オーダイル	Water	none	160
161	Sentret	オタチ	Normal	none	161
162	Furret	オオタチ	Normal	none	162
163	Hoothoot	ホーホー	Normal	Flying	163
164	Noctowl	ヨルノズク	Normal	Flying	164
165	Ledyba	レディバ	Bug	Flying	165
166	Ledian	レディアン	Bug	Flying	166
167	Spinarak	イトマル	Bug	Poison	167
168	Ariados	アリアドス	Bug	Poison	168
169	Crobat	クロバット	Poison	Flying	169
170	Chinchou	チョンチー	Water	Electric	170
171	Lanturn	ランターン	Water	Electric	171
172	Pichu	ピチュー	Electric	none	172
173	Cleffa	ピィ	Fairy	none	173
174	Igglybuff	ププリン	Normal	Fairy	174
175	Togepi	トゲピー	Fairy	none	175
176	Togetic	トゲチック	Fairy	Flying	176
177	Natu	ネイティ	Psychic	Flying	177
178	Xatu	ネイティオ	Psychic	Flying	178
179	Mareep	メリープ	Electric	none	179
180	Flaaffy	モココ	Electric	none	180
181	Ampharos	デンリュウ	Electric	none	181
182	Bellossom	キレイハナ	Grass	none	182
183	Marill	マリル	Water	Fairy	183
184	Azumarill	マリルリ	Water	Fairy	184
185	Sudowoodo	ウソッキー	Rock	none	185
186	Politoed	ニョロトノ	Water	none	186
187	Hoppip	ハネッコ	Grass	Flying	187
188	Skiploom	ポポッコ	Grass	Flying	188
189	Jumpluff	ワタッコ	Grass	Flying	189
190	Aipom	エイパム	Normal	none	190
191	Sunkern	ヒマナッツ	Grass	none	191
192	Sunflora	キマワリ	Grass	none	192
193	Yanma	ヤンヤンマ	Bug	Flying	193
194	Wooper	ウパー	Water	Ground	194
195	Quagsire	ヌオー	Water	Ground	195
196	Espeon	エーフィ	Psychic	none	196
197	Umbreon	ブラッキー	Dark	none	197
198	Murkrow	ヤミカラス	Dark	Flying	198
199	Slowking	ヤドキング	Water	Psychic	199
200	Misdreavus	ムウマ	Ghost	none	200
201	Unown	アンノーン	Psychic	none	201A
202	Wobbuffet	ソーナンス	Psychic	none	202
203	Girafarig	キリンリキ	Normal	Psychic	203
204	Pineco	クヌギダマ	Bug	none	204
205	Forretress	フォレトス	Bug	Steel	205
206	Dunsparce	ノコッチ	Normal	none	206
207	Gligar	グライガー	Ground	Flying	207
208	Steelix	ハガネール	Steel	Ground	208
209	Snubbull	ブルー	Fairy	none	209
210	Granbull	グランブル	Fairy	none	210
211	Qwilfish	ハリーセン	Water	Poison	211
212	Scizor	ハッサム	Bug	Steel	212
213	Shuckle	ツボツボ	Bug	Rock	213
214	Heracross	ヘラクロス	Bug	Fighting	214
215	Sneasel	ニューラ	Dark	Ice	215
216	Teddiursa	ヒメグマ	Normal	none	216
217	Ursaring	リングマ	Normal	none	217
218	Slugma	マグマッグ	Fire	none	218
219	Magcargo	マグカルゴ	Fire	Rock	219
220	Swinub	ウリムー	Ice	Ground	220
221	Piloswine	イノムー	Ice	Ground	221
222	Corsola	サニーゴ	Water	Rock	222
223	Remoraid	テッポウオ	Water	none	223
224	Octillery	オクタン	Water	none	224
225	Delibird	デリバード	Ice	Flying	225
226	Mantine	マンタイン	Water	Flying	226
227	Skarmory	エアームド	Steel	Flying	227
228	Houndour	デルビル	Dark	Fire	228
229	Houndoom	ヘルガー	Dark	Fire	229
230	Kingdra	キングドラ	Water	Dragon	230
231	Phanpy	ゴマゾウ	Ground	none	231
232	Donphan	ドンファン	Ground	none	232
233	Porygon2	ポリゴン２	Normal	none	233
234	Stantler	オドシシ	Normal	none	234
235	Smeargle	ドーブル	Normal	none	235
236	Tyrogue	バルキー	Fighting	none	236
237	Hitmontop	カポエラー	Fighting	none	237
238	Smoochum	ムチュール	Ice	Psychic	238
239	Elekid	エレキッド	Electric	none	239
240	Magby	ブビィ	Fire	none	240
241	Miltank	ミルタンク	Normal	none	241
242	Blissey	ハピナス	Normal	none	242
243	Raikou	ライコウ	Electric	none	243
244	Entei	エンテイ	Fire	none	244
245	Suicune	スイクン	Water	none	245
246	Larvitar	ヨーギラス	Rock	Ground	246
247	Pupitar	サナギラス	Rock	Ground	247
248	Tyranitar	バンギラス	Rock	Dark	248
249	Lugia	ルギア	Psychic	Flying	249
250	Ho-Oh	ホウオウ	Fire	Flying	250
251	Celebi	セレビィ	Psychic	Grass	251*/}.toString().slice(14,-3);

return all;
}


function getGenIII()
{
var all = function(){/*
252	Treecko	キモリ	Grass	none	252
253	Grovyle	ジュプトル	Grass	none	253
254	Sceptile	ジュカイン	Grass	none	254
255	Torchic	アチャモ	Fire	none	255
256	Combusken	ワカシャモ	Fire	Fighting	256
257	Blaziken	バシャーモ	Fire	Fighting	257
258	Mudkip	ミズゴロウ	Water	none	258
259	Marshtomp	ヌマクロー	Water	Ground	259
260	Swampert	ラグラージ	Water	Ground	260
261	Poochyena	ポチエナ	Dark	none	261
262	Mightyena	グラエナ	Dark	none	262
263	Zigzagoon	ジグザグマ	Normal	none	263
264	Linoone	マッスグマ	Normal	none	264
265	Wurmple	ケムッソ	Bug	none	265
266	Silcoon	カラサリス	Bug	none	266
267	Beautifly	アゲハント	Bug	Flying	267
268	Cascoon	マユルド	Bug	none	268
269	Dustox	ドクケイル	Bug	Poison	269
270	Lotad	ハスボー	Water	Grass	270
271	Lombre	ハスブレロ	Water	Grass	271
272	Ludicolo	ルンパッパ	Water	Grass	272
273	Seedot	タネボー	Grass	none	273
274	Nuzleaf	コノハナ	Grass	Dark	274
275	Shiftry	ダーテング	Grass	Dark	275
276	Taillow	スバメ	Normal	Flying	276
277	Swellow	オオスバメ	Normal	Flying	277
278	Wingull	キャモメ	Water	Flying	278
279	Pelipper	ペリッパー	Water	Flying	279
280	Ralts	ラルトス	Psychic	Fairy	280
281	Kirlia	キルリア	Psychic	Fairy	281
282	Gardevoir	サーナイト	Psychic	Fairy	282
283	Surskit	アメタマ	Bug	Water	283
284	Masquerain	アメモース	Bug	Flying	284
285	Shroomish	キノココ	Grass	none	285
286	Breloom	キノガッサ	Grass	Fighting	286
287	Slakoth	ナメケロ	Normal	none	287
288	Vigoroth	ヤルキモノ	Normal	none	288
289	Slaking	ケッキング	Normal	none	289
290	Nincada	ツチニン	Bug	Ground	290
291	Ninjask	テッカニン	Bug	Flying	291
292	Shedinja	ヌケニン	Bug	Ghost	292
293	Whismur	ゴニョニョ	Normal	none	293
294	Loudred	ドゴーム	Normal	none	294
295	Exploud	バクオング	Normal	none	295
296	Makuhita	マクノシタ	Fighting	none	296
297	Hariyama	ハリテヤマ	Fighting	none	297
298	Azurill	ルリリ	Normal	Fairy	298
299	Nosepass	ノズパス	Rock	none	299
300	Skitty	エネコ	Normal	none	300
301	Delcatty	エネコロロ	Normal	none	301
302	Sableye	ヤミラミ	Dark	Ghost	302
303	Mawile	クチート	Steel	Fairy	303
304	Aron	ココドラ	Steel	Rock	304
305	Lairon	コドラ	Steel	Rock	305
306	Aggron	ボスゴドラ	Steel	Rock	306
307	Meditite	アサナン	Fighting	Psychic	307
308	Medicham	チャーレム	Fighting	Psychic	308
309	Electrike	ラクライ	Electric	none	309
310	Manectric	ライボルト	Electric	none	310
311	Plusle	プラスル	Electric	none	311
312	Minun	マイナン	Electric	none	312
313	Volbeat	バルビート	Bug	none	313
314	Illumise	イルミーゼ	Bug	none	314
315	Roselia	ロゼリア	Grass	Poison	315
316	Gulpin	ゴクリン	Poison	none	316
317	Swalot	マルノーム	Poison	none	317
318	Carvanha	キバニア	Water	Dark	318
319	Sharpedo	サメハダー	Water	Dark	319
320	Wailmer	ホエルコ	Water	none	320
321	Wailord	ホエルオー	Water	none	321
322	Numel	ドンメル	Fire	Ground	322
323	Camerupt	バクーダ	Fire	Ground	323
324	Torkoal	コータス	Fire	none	324
325	Spoink	バネブー	Psychic	none	325
326	Grumpig	ブーピッグ	Psychic	none	326
327	Spinda	パッチール	Normal	none	327
328	Trapinch	ナックラー	Ground	none	328
329	Vibrava	ビブラーバ	Ground	Dragon	329
330	Flygon	フライゴン	Ground	Dragon	330
331	Cacnea	サボネア	Grass	none	331
332	Cacturne	ノクタス	Grass	Dark	332
333	Swablu	チルット	Normal	Flying	333
334	Altaria	チルタリス	Dragon	Flying	334
335	Zangoose	ザングース	Normal	none	335
336	Seviper	ハブネーク	Poison	none	336
337	Lunatone	ルナトーン	Rock	Psychic	337
338	Solrock	ソルロック	Rock	Psychic	338
339	Barboach	ドジョッチ	Water	Ground	339
340	Whiscash	ナマズン	Water	Ground	340
341	Corphish	ヘイガニ	Water	none	341
342	Crawdaunt	シザリガー	Water	Dark	342
343	Baltoy	ヤジロン	Ground	Psychic	343
344	Claydol	ネンドール	Ground	Psychic	344
345	Lileep	リリーラ	Rock	Grass	345
346	Cradily	ユレイドル	Rock	Grass	346
347	Anorith	アノプス	Rock	Bug	347
348	Armaldo	アーマルド	Rock	Bug	348
349	Feebas	ヒンバス	Water	none	349
350	Milotic	ミロカロス	Water	none	350
351	Castform	ポワルン	Normal	none	351A
351	Castform	ポワルン	Fire	none	351B
351	Castform	ポワルン	Water	none	351C
351	Castform	ポワルン	Ice	none	351D
352	Kecleon	カクレオン	Normal	none	352
353	Shuppet	カゲボウズ	Ghost	none	353
354	Banette	ジュペッタ	Ghost	none	354
355	Duskull	ヨマワル	Ghost	none	355
356	Dusclops	サマヨール	Ghost	none	356
357	Tropius	トロピウス	Grass	Flying	357
358	Chimecho	チリーン	Psychic	none	358
359	Absol	アブソル	Dark	none	359
360	Wynaut	ソーナノ	Psychic	none	360
361	Snorunt	ユキワラシ	Ice	none	361
362	Glalie	オニゴーリ	Ice	none	362
363	Spheal	タマザラシ	Ice	Water	363
364	Sealeo	トドグラー	Ice	Water	364
365	Walrein	トドゼルガ	Ice	Water	365
366	Clamperl	パールル	Water	none	366
367	Huntail	ハンテール	Water	none	367
368	Gorebyss	サクラビス	Water	none	368
369	Relicanth	ジーランス	Water	Rock	369
370	Luvdisc	ラブカス	Water	none	370
371	Bagon	タツベイ	Dragon	none	371
372	Shelgon	コモルー	Dragon	none	372
373	Salamence	ボーマンダ	Dragon	Flying	373
374	Beldum	ダンバル	Steel	Psychic	374
375	Metang	メタング	Steel	Psychic	375
376	Metagross	メタグロス	Steel	Psychic	376
377	Regirock	レジロック	Rock	none	377
378	Regice	レジアイス	Ice	none	378
379	Registeel	レジスチル	Steel	none	379
380	Latias	ラティアス	Dragon	Psychic	380
381	Latios	ラティオス	Dragon	Psychic	381
382	Kyogre	カイオーガ	Water	none	382
383	Groudon	グラードン	Ground	none	383
384	Rayquaza	レックウザ	Dragon	Flying	384
385	Jirachi	ジラーチ	Steel	Psychic	385
386	Deoxys	デオキシス	Psychic	none	386A*/}.toString().slice(14,-3);

return all;
}


function getGenIV()
{
var all = function(){/*
387	Turtwig	ナエトル	Grass	none	387
388	Grotle	ハヤシガメ	Grass	none	388
389	Torterra	ドダイトス	Grass	Ground	389
390	Chimchar	ヒコザル	Fire	none	390
391	Monferno	モウカザル	Fire	Fighting	391
392	Infernape	ゴウカザル	Fire	Fighting	392
393	Piplup	ポッチャマ	Water	none	393
394	Prinplup	ポッタイシ	Water	none	394
395	Empoleon	エンペルト	Water	Steel	395
396	Starly	ムックル	Normal	Flying	396
397	Staravia	ムクバード	Normal	Flying	397
398	Staraptor	ムクホーク	Normal	Flying	398
399	Bidoof	ビッパ	Normal	none	399
400	Bibarel	ビーダル	Normal	Water	400
401	Kricketot	コロボーシ	Bug	none	401
402	Kricketune	コロトック	Bug	none	402
403	Shinx	コリンク	Electric	none	403
404	Luxio	ルクシオ	Electric	none	404
405	Luxray	レントラー	Electric	none	405
406	Budew	スボミー	Grass	Poison	406
407	Roserade	ロズレイド	Grass	Poison	407
408	Cranidos	ズガイドス	Rock	none	408
409	Rampardos	ラムパルド	Rock	none	409
410	Shieldon	タテトプス	Rock	Steel	410
411	Bastiodon	トリテプス	Rock	Steel	411
412	Burmy	ミノムッチ	Bug	none	412A
413	Wormadam	ミノマダム	Bug	Grass	413A
413	Wormadam	ミノマダム	Bug	Ground	413B
413	Wormadam	ミノマダム	Bug	Steel	413C
414	Mothim	ガーメイル	Bug	Flying	414
415	Combee	ミツハニー	Bug	Flying	415
416	Vespiquen	ビークイン	Bug	Flying	416
417	Pachirisu	パチリス	Electric	none	417
418	Buizel	ブイゼル	Water	none	418
419	Floatzel	フローゼル	Water	none	419
420	Cherubi	チェリンボ	Grass	none	420
421	Cherrim	チェリム	Grass	none	421A
422	Shellos	カラナクシ	Water	none	422A
423	Gastrodon	トリトドン	Water	Ground	423A
424	Ambipom	エテボース	Normal	none	424
425	Drifloon	フワンテ	Ghost	Flying	425
426	Drifblim	フワライド	Ghost	Flying	426
427	Buneary	ミミロル	Normal	none	427
428	Lopunny	ミミロップ	Normal	none	428
429	Mismagius	ムウマージ	Ghost	none	429
430	Honchkrow	ドンカラス	Dark	Flying	430
431	Glameow	ニャルマー	Normal	none	431
432	Purugly	ブニャット	Normal	none	432
433	Chingling	リーシャン	Psychic	none	433
434	Stunky	スカンプー	Poison	Dark	434
435	Skuntank	スカタンク	Poison	Dark	435
436	Bronzor	ドーミラー	Steel	Psychic	436
437	Bronzong	ドータクン	Steel	Psychic	437
438	Bonsly	ウソハチ	Rock	none	438
439	Mime Jr.	マネネ	Psychic	Fairy	439
440	Happiny	ピンプク	Normal	none	440
441	Chatot	ペラップ	Normal	Flying	441
442	Spiritomb	ミカルゲ	Ghost	none	442
443	Gible	フカマル	Dragon	Ground	443
444	Gabite	ガバイト	Dragon	Ground	444
445	Garchomp	ガブリアス	Dragon	Ground	445
446	Munchlax	ゴンベ	Normal	none	446
447	Riolu	リオル	Fighting	none	447
448	Lucario	ルカリオ	Fighting	Steel	448
449	Hippopotas	ヒポポタス	Ground	none	449
450	Hippowdon	カバルドン	Ground	none	450
451	Skorupi	スコルピ	Poison	Bug	451
452	Drapion	ドラピオン	Poison	Dark	452
453	Croagunk	グレッグル	Poison	Fighting	453
454	Toxicroak	ドクロッグ	Poison	Fighting	454
455	Carnivine	マスキッパ	Grass	none	455
456	Finneon	ケイコウオ	Water	none	456
457	Lumineon	ネオラント	Water	none	457
458	Mantyke	タマンタ	Water	Flying	458
459	Snover	ユキカブリ	Grass	Ice	459
460	Abomasnow	ユキノオー	Grass	Ice	460
461	Weavile	マニューラ	Dark	Ice	461
462	Magnezone	ジバコイル	Electric	Steel	462
463	Lickilicky	ベロベルト	Normal	none	463
464	Rhyperior	ドサイドン	Ground	Rock	464
465	Tangrowth	モジャンボ	Grass	none	465
466	Electivire	エレキブル	Electric	none	466
467	Magmortar	ブーバーン	Fire	none	467
468	Togekiss	トゲキッス	Fairy	Flying	468
469	Yanmega	メガヤンマ	Bug	Flying	469
470	Leafeon	リーフィア	Grass	none	470
471	Glaceon	グレイシア	Ice	none	471
472	Gliscor	グライオン	Ground	Flying	472
473	Mamoswine	マンムー	Ice	Ground	473
474	Porygon-Z	ポリゴンＺ	Normal	none	474
475	Gallade	エルレイド	Psychic	Fighting	475
476	Probopass	ダイノーズ	Rock	Steel	476
477	Dusknoir	ヨノワール	Ghost	none	477
478	Froslass	ユキメノコ	Ice	Ghost	478
479	Rotom	ロトム	Electric	Ghost	479
479	Rotom	ロトム	Electric	Fire	479B
479	Rotom	ロトム	Electric	Water	479C
479	Rotom	ロトム	Electric	Ice	479D
479	Rotom	ロトム	Electric	Flying	479E
479	Rotom	ロトム	Electric	Grass	479F
480	Uxie	ユクシー	Psychic	none	480
481	Mesprit	エムリット	Psychic	none	481
482	Azelf	アグノム	Psychic	none	482
483	Dialga	ディアルガ	Steel	Dragon	483
484	Palkia	パルキア	Water	Dragon	484
485	Heatran	ヒードラン	Fire	Steel	485
486	Regigigas	レジギガス	Normal	none	486
487	Giratina	ギラティナ	Ghost	Dragon	487A
488	Cresselia	クレセリア	Psychic	none	488
489	Phione	フィオネ	Water	none	489
490	Manaphy	マナフィ	Water	none	490
491	Darkrai	ダークライ	Dark	none	491
492	Shaymin	シェイミ	Grass	none	492A
492	Shaymin	シェイミ	Grass	Flying	492B
493	Arceus	アルセウス	Normal	none	493*/}.toString().slice(14,-3);

return all;
}

function getGenV()
{
var all = function(){/*
494	Victini	ビクティニ	Psychic	Fire	494
495	Snivy	ツタージャ	Grass	none	495
496	Servine	ジャノビー	Grass	none	496
497	Serperior	ジャローダ	Grass	znone	497
498	Tepig	ポカブ	Fire	none	498
499	Pignite	チャオブー	Fire	Fighting	499
500	Emboar	エンブオー	Fire	Fighting	500
501	Oshawott	ミジュマル	Water	none	501
502	Dewott	フタチマル	Water	none	502
503	Samurott	ダイケンキ	Water	none	503
504	Patrat	ミネズミ	Normal	none	504
505	Watchog	ミルホッグ	Normal	none	505
506	Lillipup	ヨーテリー	Normal	none	506
507	Herdier	ハーデリア	Normal	none	507
508	Stoutland	ムーランド	Normal	none	508
509	Purrloin	チョロネコ	Dark	none	509
510	Liepard	レパルダス	Dark	none	510
511	Pansage	ヤナップ	Grass	none	511
512	Simisage	ヤナッキー	Grass	none	512
513	Pansear	バオップ	Fire	none	513
514	Simisear	バオッキー	Fire	none	514
515	Panpour	ヒヤップ	Water	none	515
516	Simipour	ヒヤッキー	Water	none	516
517	Munna	ムンナ	Psychic	none	517
518	Musharna	ムシャーナ	Psychic	none	518
519	Pidove	マメパト	Normal	Flying	519
520	Tranquill	ハトーボー	Normal	Flying	520
521	Unfezant	ケンホロウ	Normal	Flying	521
522	Blitzle	シママ	Electric	none	522
523	Zebstrika	ゼブライカ	Electric	none	523
524	Roggenrola	ダンゴロ	Rock	none	524
525	Boldore	ガントル	Rock	none	525
526	Gigalith	ギガイアス	Rock	none	526
527	Woobat	コロモリ	Psychic	Flying	527
528	Swoobat	ココロモリ	Psychic	Flying	528
529	Drilbur	モグリュー	Ground	none	529
530	Excadrill	ドリュウズ	Ground	Steel	530
531	Audino	タブンネ	Normal	none	531
532	Timburr	ドッコラー	Fighting	none	532
533	Gurdurr	ドテッコツ	Fighting	none	533
534	Conkeldurr	ローブシン	Fighting	none	534
535	Tympole	オタマロ	Water	none	535
536	Palpitoad	ガマガル	Water	Ground	536
537	Seismitoad	ガマゲロゲ	Water	Ground	537
538	Throh	ナゲキ	Fighting	none	538
539	Sawk	ダゲキ	Fighting	none	539
540	Sewaddle	クルミル	Bug	Grass	540
541	Swadloon	クルマユ	Bug	Grass	541
542	Leavanny	ハハコモリ	Bug	Grass	542
543	Venipede	フシデ	Bug	Poison	543
544	Whirlipede	ホイーガ	Bug	Poison	544
545	Scolipede	ペンドラー	Bug	Poison	545
546	Cottonee	モンメン	Grass	Fairy	546
547	Whimsicott	エルフーン	Grass	Fairy	547
548	Petilil	チュリネ	Grass	none	548
549	Lilligant	ドレディア	Grass	none	549
550	Basculin	バスラオ	Water	none	550
551	Sandile	メグロコ	Ground	Dark	551
552	Krokorok	ワルビル	Ground	Dark	552
553	Krookodile	ワルビアル	Ground	Dark	553
554	Darumaka	ダルマッカ	Fire	none	554
555	Darmanitan	ヒヒダルマ	Fire	none	555
555	Darmanitan	ヒヒダルマ	Fire	Psychic	555A
556	Maractus	マラカッチ	Grass	none	556
557	Dwebble	イシズマイ	Bug	Rock	557
558	Crustle	イワパレス	Bug	Rock	558
559	Scraggy	ズルッグ	Dark	Fighting	559
560	Scrafty	ズルズキン	Dark	Fighting	560
561	Sigilyph	シンボラー	Psychic	Flying	561
562	Yamask	デスマス	Ghost	none	562
563	Cofagrigus	デスカーン	Ghost	none	563
564	Tirtouga	プロトーガ	Water	Rock	564
565	Carracosta	アバゴーラ	Water	Rock	565
566	Archen	アーケン	Rock	Flying	566
567	Archeops	アーケオス	Rock	Flying	567
568	Trubbish	ヤブクロン	Poison	none	568
569	Garbodor	ダストダス	Poison	none	569
570	Zorua	ゾロア	Dark	none	570
571	Zoroark	ゾロアーク	Dark	none	571
572	Minccino	チラーミィ	Normal	none	572
573	Cinccino	チラチーノ	Normal	none	573
574	Gothita	ゴチム	Psychic	none	574
575	Gothorita	ゴチミル	Psychic	none	575
576	Gothitelle	ゴチルゼル	Psychic	none	576
577	Solosis	ユニラン	Psychic	none	577
578	Duosion	ダブラン	Psychic	none	578
579	Reuniclus	ランクルス	Psychic	none	579
580	Ducklett	コアルヒー	Water	Flying	580
581	Swanna	スワンナ	Water	Flying	581
582	Vanillite	バニプッチ	Ice	none	582
583	Vanillish	バニリッチ	Ice	none	583
584	Vanilluxe	バイバニラ	Ice	none	584
585	Deerling	シキジカ	Normal	Grass	585
586	Sawsbuck	メブキジカ	Normal	Grass	586
587	Emolga	エモンガ	Electric	Flying	587
588	Karrablast	カブルモ	Bug	none	588
589	Escavalier	シュバルゴ	Bug	Steel	589
590	Foongus	タマゲタケ	Grass	Poison	590
591	Amoonguss	モロバレル	Grass	Poison	591
592	Frillish	プルリル	Water	Ghost	592
593	Jellicent	ブルンゲル	Water	Ghost	593
594	Alomomola	ママンボウ	Water	none	594
595	Joltik	バチュル	Bug	Electric	595
596	Galvantula	デンチュラ	Bug	Electric	596
597	Ferroseed	テッシード	Grass	Steel	597
598	Ferrothorn	ナットレイ	Grass	Steel	598
599	Klink	ギアル	Steel	none	599
600	Klang	ギギアル	Steel	none	600
601	Klinklang	ギギギアル	Steel	none	601
602	Tynamo	シビシラス	Electric	none	602
603	Eelektrik	シビビール	Electric	none	603
604	Eelektross	シビルドン	Electric	none	604
605	Elgyem	リグレー	Psychic	none	605
606	Beheeyem	オーベム	Psychic	none	606
607	Litwick	ヒトモシ	Ghost	Fire	607
608	Lampent	ランプラー	Ghost	Fire	608
609	Chandelure	シャンデラ	Ghost	Fire	609
610	Axew	キバゴ	Dragon	none	610
611	Fraxure	オノンド	Dragon	none	611
612	Haxorus	オノノクス	Dragon	none	612
613	Cubchoo	クマシュン	Ice	none	613
614	Beartic	ツンベアー	Ice	none	614
615	Cryogonal	フリージオ	Ice	none	615
616	Shelmet	チョボマキ	Bug	none	616
617	Accelgor	アギルダー	Bug	none	617
618	Stunfisk	マッギョ	Ground	Electric	618
619	Mienfoo	コジョフー	Fighting	none	619
620	Mienshao	コジョンド	Fighting	none	620
621	Druddigon	クリムガン	Dragon	none	621
622	Golett	ゴビット	Ground	Ghost	622
623	Golurk	ゴルーグ	Ground	Ghost	623
624	Pawniard	コマタナ	Dark	Steel	624
625	Bisharp	キリキザン	Dark	Steel	625
626	Bouffalant	バッフロン	Normal	none	626
627	Rufflet	ワシボン	Normal	Flying	627
628	Braviary	ウォーグル	Normal	Flying	628
629	Vullaby	バルチャイ	Dark	Flying	629
630	Mandibuzz	バルジーナ	Dark	Flying	630
631	Heatmor	クイタラン	Fire	none	631
632	Durant	アイアント	Bug	Steel	632
633	Deino	モノズ	Dark	Dragon	633
634	Zweilous	ジヘッド	Dark	Dragon	634
635	Hydreigon	サザンドラ	Dark	Dragon	635
636	Larvesta	メラルバ	Bug	Fire	636
637	Volcarona	ウルガモス	Bug	Fire	637
638	Cobalion	コバルオン	Steel	Fighting	638
639	Terrakion	テラキオン	Rock	Fighting	639
640	Virizion	ビリジオン	Grass	Fighting	640
641	Tornadus	トルネロス	Flying	none	641
642	Thundurus	ボルトロス	Electric	Flying	642
643	Reshiram	レシラム	Dragon	Fire	643
644	Zekrom	ゼクロム	Dragon	Electric	644
645	Landorus	ランドロス	Ground	Flying	645
646	Kyurem	キュレム	Dragon	Ice	646
647	Keldeo	ケルディオ	Water	Fighting	647
648	Meloetta	メロエッタ	Normal	Psychic	648
648	Meloetta	メロエッタ	Normal	Fighting	648A
649	Genesect	ゲノセクト	Bug	Steel	649*/}.toString().slice(14,-3);

return all;
}


function getGenVI()
{
var all = function(){/*
650	Chespin	ハリマロン	Grass	none	650
651	Quilladin	ハリボーグ	Grass	none	651
652	Chesnaught	ブリガロン	Grass	Fighting	652
653	Fennekin	フォッコ	Fire	none	653
654	Braixen	テールナー	Fire	none	654
655	Delphox	マフォクシー	Fire	Psychic	655
656	Froakie	ケロマツ	Water	none	656
657	Frogadier	ゲコガシラ	Water	none	657
658	Greninja	ゲッコウガ	Water	Dark	658
659	Bunnelby	ホルビー	Normal	none	659
660	Diggersby	ホルード	Normal	Ground	660
661	Fletchling	ヤヤコマ	Normal	Flying	661
662	Fletchinder	ヒノヤコマ	Fire	Flying	662
663	Talonflame	ファイアロー	Fire	Flying	663
664	Scatterbug	コフキムシ	Bug	none	664
665	Spewpa	コフーライ	Bug	none	665
666	Vivillon	ビビヨン	Bug	Flying	666
667	Litleo	シシコ	Fire	Normal	667
668	Pyroar	カエンジシ	Fire	Normal	668
669	Flabébé	フラベベ	Fairy	none	669
670	Floette	フラエッテ	Fairy	none	670
671	Florges	フラージェス	Fairy	none	671
672	Skiddo	メェークル	Grass	none	672
673	Gogoat	ゴーゴート	Grass	none	673
674	Pancham	ヤンチャム	Dark	none	674
675	Pangoro	ゴロンダ	Dark	Fighting	675
676	Furfrou	トリミアン	Normal	none	676
677	Espurr	ニャスパー	Psychic	none	677
678	Meowstic	ニャオニクス	Psychic	none	678
679	Honedge	ヒトツキ	Steel	Ghost	679
680	Doublade	ビクティニ	Steel	Ghost	680
681	Aegislash	ギルガルド	Steel	Ghost	681
682	Spritzee	シュシュプ	Fairy	none	682
683	Aromatisse	フレフワン	Fairy	none	683
684	Swirlix	ペロッパフ	Fairy	none	684
685	Slurpuff	ペロリーム	Fairy	none	685
686	Inkay	マーイーカ	Dark	Psychic	686
687	Malamar	カラマネロ	Dark	Psychic	687
688	Binacle	カメテテ	Rock	Water	688
689	Barbaracle	ガメノデス	Rock	Water	689
690	Skrelp	クズモー	Poison	Water	690
691	Dragalge	ドラミドロ	Poison	Dragon	691
692	Clauncher	ウデッポウ	Water	none	692
693	Clawitzer	ブロスター	Water	none	693
694	Helioptile	エリキテル	Electric	Normal	694
695	Heliolisk	エレザード	Electric	Normal	695
696	Tyrunt	チゴラス	Rock	Dragon	696
697	Tyrantrum	ガチゴラス	Rock	Dragon	697
698	Amaura	アマルス	Rock	Ice	698
699	Aurorus	アマルルガ	Rock	Ice	699
700	Sylveon	ニンフィア	Fairy	none	700
701	Hawlucha	ルチャブル	Fighting	Flying	701
702	Dedenne	デデンネ	Electric	Fairy	702
703	Carbink	メレシー	Rock	Fairy	703
704	Goomy	ヌメラ	Dragon	none	704
705	Sliggoo	ヌメイル	Dragon	none	705
706	Goodra	ヌメルゴン	Dragon	none	706
707	Klefki	クレッフィ	Steel	Fairy	707
708	Phantump	ボクレー	Ghost	Grass	708
709	Trevenant	オーロット	Ghost	Grass	709
710	Pumpkaboo	バケッチャ	Ghost	Grass	710
711	Gourgeist	パンプジン	Ghost	Grass	711
712	Bergmite	カチコール	Ice	none	712
713	Avalugg	クレベース	Ice	none	713
714	Noibat	オンバット	Flying	Dragon	714
715	Noivern	オンバーン	Flying	Dragon	715
716	Xerneas	ゼルネアス	Fairy	none	716
717	Yveltal	イベルタル	Dark	Flying	717
718	Zygarde	ジガルデ	Dragon	Ground	718
719	Diancie	ディアンシー	Rock	Fairy	719
720	Hoopa	フーパ	Psychic	Ghost	720
720	Hoopa	フーパ	Psychic	Dark	721*/}.toString().slice(14,-3);

return all;
}



// function getPokeNames()
// {
// 	return ["pikachu"]			
// }

// $(document).ready(function()
// {
//   console.log("document ready")
// 	var pageContent = $("body").html();
	
// 	var pokeNames = getPokeNames();
// 	for( var i=0; i < pokeNames.length; i++ )
// 	{
// 		var myRegex = new RegExp( "("+pokeNames[i]+")","gi");
// 		var replacement = '<span id="pokemon" pokindex="'+(1+i)+'">'+'$1'+'</span>';
// 		pageContent = pageContent.replace( myRegex, replacement);
// 	}

// 	$("body").html( pageContent );
// 		console.log(pageContent);		
	
// 	$("b#pokemon").hover( 
// 		function(){
// 			$(this).css("color","red");
// 			var pokindex = $(this).attr("pokindex");
			
// 			var imgUrl = "pokemon/dream-world/"+pokindex+".svg";
				
// 			$("#dialog").html('<img src='+imgUrl+' width="150" height="150"></img>');			
// 			$("#dialog").css( "border-style", "solid" );
// 			$("#dialog").dialog({ autoOpen: false });
// 			$('#dialog').dialog( {position : { my: "left top", at: "left bottom", of: $(this) } } );
// 			$('#dialog').dialog('open');
// 		},
// 		function(){
// 			$(this).css("color","black");
// 			$('#dialog').dialog('close');
// 		});
// });
