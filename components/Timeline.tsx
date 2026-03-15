import Image from "next/image";
import { Timeline } from "@/components/ui/timeline";

export default function TimelineBox() {
	const data = [
		{
			title: "1973 - 1979",
			content: (
				<div>
					<h1 className="mb-2 text-2xl font-bold italic">GLI ALBORI</h1>
					<p className="mb-8 text-neutral-800 dark:text-neutral-200">
						I primissimi deltaplanisti italiani, capitanati da Alfio Caronti,
						iniziano le attività sul lago di Como trainati da un motoscafo, ma
						in breve il virus si propaga a macchia d&apos;olio in tutto larco
						alpino e arriva ovviamente anche sul Grappa. Il monte sacro alla
						Patria del resto è già stato sfruttato per un “volo libero”
						addirittura nel primo dopoguerra!!! Correva l&apos;anno 1933 quando
						Aldo Bellò, originario di Solagna, decollava con un aliante lanciato
						da un elastico in zona cima Grappa. <br />
						<br />
						<strong>
							40 anni dopo la tecnologia ha finalmente reso più “semplice”
							volare.
						</strong>
						Il primo ad approfittarne, in zona, è stato Gaetano Gioppo che
						all&apos;inizio volava prevalentemente dalla “Barricata”, sul Costo
						di Asiago. Poco dopo lo seguono per le vie dell&apos;aere Norberto
						Savio, Gianni Menegotto e Flavio Ceccato mentre il primo a tornare
						in Grappa dopo Bellò è invece probabilmente Gigi Caron. Purtroppo
						date e luoghi in questa fase sono confusi <br />
						<br />
						<strong>
							Si volava dove e come si poteva, da autodidatti: compravi un delta
							e partivi.{" "}
						</strong>
						Menegotto per esempio aveva fatto i primi voli in montagna, con gli
						sci. Aveva attaccato al delta un imbrago da paracadutismo e nessuno
						gli aveva ovviamente detto niente circa l&apos;altezza
						dell&apos;attacco, così volava tranquillo con la barra davanti al
						naso, in piedi. Tutto bene finché non è andato dalle parti di Asiago
						a provare senza sci. C&apos;era vento e non credeva di dover correre
						tanto, invece quando ha iniziato la corsa si è accorto che ci voleva
						più birra… purtroppo invece è inciampato. Il delta un po&apos;
						portava e questo gli ha evitato danni. Ha solo strisciato a pancia
						in giù sul fianco della collina… 300 metri di prato… concimato di
						fresco!! Dopo tre giorni di docce e tre notti a dormire in garage ha
						contattato Gioppo per farsi insegnare. È stato così che ha scoperto
						tra la altre cose che in atterraggio il delta andava stallato
						spingendo sui montanti. Prima si limitava a mollare tutto e
						aspettare il botto, oppure mirava una siepe. Non per niente è suo il
						record di montanti rotti: 4 in un solo volo (due in decollo e due
						dopo, in atterraggio). 240 mila lire dell&apos;epoca. <br />
						<br />I primi delta avevano un naso molto chiuso, un tunnel enorme
						sulle ali e il problema del drappo: in caso di stallo buttavano giù
						il muso e buonanotte. È stato così che Ivano, per non rischiare lo
						stallo, è sceso talmente veloce da perdere le stecche in volo. Il
						suo “istruttore” dopo l&apos;atterraggio gli ha detto “Bisogna che
						ri-voli subito” così hanno piegato un po&apos; di canalette da
						elettricista per rifare le stecche e prima di sera ha fatto il
						secondo volo. Certo questi delta primigenii avevano un grande
						vantaggio: atterravi anche sullo stretto, tipo orti e persino
						terrazze e davanzali… <br />
						<br />
						<strong>
							Erano anni di prove ed esperimenti; definirli pionieristici è
							riduttivo.{" "}
						</strong>{" "}
						<br />È stato come sbarcare su un pianeta sconosciuto e dover
						fondare da zero una società civile. In quegli anni si sono visti
						delta biplano, delta con la carlinga, delta autocostruiti in casa
						(con relativa demolizione del portone del garage per farli uscire).
						È documentato anche il caso di un certo Magagnini che è “decollato”
						legato a centinaia di palloncini!!! Quando è stato sufficientemente
						in alto ha tagliato il vincolo ed ha iniziato la planata. <br />
						<br />
						Caratteristica di quegli anni era poi la carta topografica. Ma non
						per progettare voli di distanza, figurarsi. Serviva per calcolare
						altezze e distanze tra decollo e atterraggio… per essere sicuri di
						arrivarci!! L&apos;efficienza di oggi? Molto al di là dei sogni.
						“Decollo Barricata. 4 minuti di volo. Ottimo veleggiamento” sta
						scritto nel primo libretto di voli di Gianni Menegotto. Poi arrivano
						le prime ali con un po&apos; di prestazioni. Già solo il fatto di
						stare in aria più di tre minuti permette a più gente di vedere
						questi matti e il gruppo si allarga. Nasce il Delta Club Vicenza e
						uno o due anni dopo è la volta del D.C. Bassano che opera in zona
						fino alla morte del suo presidente, Walter Zulian, avvenuta in
						conseguenza di un mancato aggancio. È un duro colpo per i 5-6 piloti
						che facevano all&apos;epoca base sul Grappa e per circa un anno
						l&apos;attività è praticamente sospesa. <br />
						<br />
						Però la voglia di volare è grande e quella di condividere questa
						passione pure. È così che{" "}
						<strong>
							dalle ceneri del Delta club Bassano nel 1979 nasce il Volo Libero
							Montegrappa.{" "}
						</strong>
						Il club era presieduto agli esordi da Flavio Cavalli, un altro che
						ha avuto un battesimo del volo molto sui generis: preso il delta
						aveva appuntamento in decollo con “l&apos;istruttore” ma quel giorno
						era proprio buona e l&apos;istruttore aveva voglia di volare così,
						verso sera, dopo ore di inutile attesa, il nostro ha preso su ed è
						sceso… in volo, ovviamente. <br />
						<br />È all&apos;incirca di quell&apos;anno anche
						l&apos;introduzione ufficiale in zona del concetto di “termica”.
						Prima tutto quello che non era placida planata era genericamente
						etichettato come “turbolenza” ed accuratamente evitato. È stato con
						l&apos;arrivo di Silvio Negrizzolo che le cose sono cambiate: lui
						conosceva bene le ascendenze perchè proveniva dall&apos;aliante (una
						volta ne ha “parcheggiato” sotto malga Foraoro…) e ha diffuso il
						“verbo” presso quella manica di scalmanati. Sono così iniziati i
						voli di cross, fonte inesauribile di avventure e aneddoti: Gigi
						Caron una volta atterra a Mussolente, col delta bianco, la barba
						bianca e la camicia bianca… “Ze rivà i angeli” gli dice una
						vecchietta vestita di nero uscita di casa con le mani giunte.. Più
						romantica l&apos;avventura di Toni Rizzolo, che volava perchè aveva
						paura di volare… Dopo un breve cross atterra dalle parti di Caltrano
						e viene aiutato da una gentile ragazza che dopo diventerà sua
						moglie. <br />
						<br />
					</p>
					<div className="grid grid-cols-1 gap-4">
						<Image
							src="/storia/STORIA_1.png"
							alt="STORIA_1973"
							width={500}
							height={400}
						/>
					</div>
				</div>
			),
		},
		{
			title: "1980 - 1990",
			content: (
				<div>
					<h1 className="mb-2 text-2xl font-bold italic">GLI ANNI 80</h1>
					<p className="mb-8 text-neutral-800 dark:text-neutral-200">
						Siamo agli anni ottanta. La fase più turbolenta è alle spalle.
						<strong>
							Sono nati i club, è nata la Federazione italiana volo libero, è
							uscita una rivista specializzata, “L&apos;aquilone”, è stato
							adottato prima il casco e poi il paracadute di emergenza e, non
							ultimo, le ali ora permettono dei bei voli.
						</strong>{" "}
						<br />
						<br />
						Storico quello di Silvio Negrizzolo nella primavera dell&apos;81 da
						Ceresana ad Aviano. Da quel volo e da un&apos;idea un po&apos; folle
						del direttivo del Volo Libero Montegrappa nascerà l&apos;anno dopo
						il <strong>Meeting Montegrappa</strong>, con le gare e
						l&apos;annessa fiera del materiale di volo che ancora oggi, a
						Pasqua, riempie di cieli della pedemontana. Iniziavano infatti i
						primi raduni, le prime competizioni e i nostri hanno pensato bene
						che le condizioni primaverili erano un&apos;ottima data per
						organizzare una manifestazione ai piedi del Grappa. <br />
						<br />
						Purtroppo non mancano incidenti e inconvenienti. Ivano Marzotto
						(Nene), forse il pilota più promettente di quegli anni, perde la
						vita a bordo di un ultraleggero pilotato da un maggiore
						dell&apos;Aeronautica. Primi anni 80: Flavio Cavalli rompe
						un&apos;ala del delta sulle Meatte, precipita, lancia
						l&apos;emergenza che però si impiglia nella struttura. Sembra non ci
						sia scampo e invece cadendo il moncone dell&apos;ala si pianta nel
						terreno e lui rimane appeso alla chiglia, a 30 cm da terra. 1983/84
						Roberto Scalettari decolla inavvertitamente sotto un fronte occluso
						(non c&apos;erano mica i satelliti allora). Inizia a salire aspirato
						dal cumulo. Il delta si copre di ghiaccio, qualche cavo si rompe.
						Quando torna a vedere il sole l&apos;altimetro da polso gli indica
						5980 m. Atterra nella zona di Marostica: nei pressi si sta
						festeggiando una prima comunione e lo ubriacano di brutto. <br />
						<br />
						Grazie al coordinamento offerto dal club{" "}
						<strong>
							inizia a farsi lentamente strada anche il concetto di sicurezza
							volo
						</strong>
						, non da tutti accettato e condiviso per la verità. Come la volta
						che Flavio, all&apos;epoca ancora presidente del club, sequestrò le
						stecche a un pilota per impedirgli di volare dentro la nebbia.
						Quando Flavio se ne andò l&apos;irriducibile entrò ne bosco, tagliò
						qualche ramo di nocciolo e usò quelli per il delta… <br />
						<br />
						Sono gli anni in cui <strong>viene costruita la pedana</strong>, si
						identificano decolli e atterraggi ad hoc, si fanno i primi difficili
						accordi con i contadini…
						<strong>Nel 1984 “nasce” il decollo di Campeggia</strong>, ancora
						oggi usato per le gare di delta. Quell&apos;anno aveva fatto molta
						neve (fu l&apos;unica volta che chiusero per neve persino le scuole
						di Rosà, me lo ricordo bene…). Il panettone era inagibile. Ad una
						settimana dalla gara ancora non c&apos;erano soluzioni in vista. Poi
						grazie a una serie di fortunate circostanze e conoscenze, nel giro
						di 3 (dicasi tre!) giorni si riuscì a fare interrare la linea
						elettrica di col Campeggia e la gara partì regolarmente. <br />
						<br />
						<strong>
							Dalla seconda metà degli anni ottanta appaiono in Grappa anche i
							primi parapendio…
						</strong>{" "}
						molto pendio e poco para vista la “distanza” a cui volano dagli
						alberi: praticamente zero. <br />
						<br />
						1988: il movimento ha assunto una rilevanza tale che{" "}
						<strong>
							viene approvata una legge per regolamentare l&apos;attività.{" "}
						</strong>{" "}
						<br />
						<br />
						Nel giro di pochi mesi i piloti in attività si vedono riconoscere un
						attestato ufficiale dall&apos;Aero Club d&apos;Itala. Subito dopo{" "}
						<strong>nascono le prime scuole </strong>(la Manta è del 1989) e
						iniziano i corsi “regolari”.
					</p>
					<div className="grid grid-cols-1 gap-4">
						<Image
							src="/storia/STORIA_1980.png"
							alt="STORIA_1980"
							width={500}
							height={400}
						/>
					</div>
				</div>
			),
		},
		{
			title: "1990 - 2009",
			content: (
				<div>
					<h1 className="mb-2 text-2xl font-bold italic">GLI ANNI DEL BOOM</h1>
					<p className="mb-8 text-neutral-800 dark:text-neutral-200">
						<strong>
							Il &apos;90 e il &apos;91 sono gli anni del boom del parapendio.{" "}
						</strong>
						Le scuole sfornano centinaia di allievi all&apos;anno, decolli e
						atterraggi si affollano di gente strana ma simpatica. È un salto
						epocale, il volo libero non è mai stato così popolare. Riesce
						tuttavia a mantenere una sincera atmosfera di grande famiglia.{" "}
						<br />
						<br />
						Il Volo Libero Montegrappa è ancora una volta in anticipo sui tempi
						e nel 1992 organizza il 1° Paragrappa Trophy. La manifestazione sarà
						poi annullata per maltempo ma è su questo nucleo che l&apos;anno
						successivo nasce il Triveneto di Parapendio, il primo circuito
						italiano di gare regionali. Da allora Borso ospita ogni anno una
						tappa del campionato. <br />
						<br />È del 1993 anche la prima “Squadra corse” con tanto di pulmino
						sponsorizzato per recarsi alle competizioni. 1995: il club organizza
						i campionati italiani di parapendio. Per la prima volta viene
						assegnata una manche superiore ai 100 km. Sarà un&apos;edizione
						indimenticabile, con una meteo mai più vista in agosto da queste
						parti (o forse sì… nel 2009) <br />
						<br />
						<strong>
							Nel 1997 il Grappa è ancora teatro di una prima mondiale: il
							matrimonio volante.{" "}
						</strong>
						Sposi, testimoni, parroco, chierichetti e invitati sono tutti in
						aria e seguono via radio la cerimonia. C&apos;è anche un numero
						considerevole di giornalisti e fotografi per una copertura mediatica
						integrale dell&apos;evento. <br />
						<br />A scriverle così una via l&apos;altra non ci si crede eppure
						nel 1998 ecco un&apos;altra idea geniale che ci hanno copiato in
						tanti… In ottobre in club avrebbe dovuto ospitare la finale della
						coppa Italia. Purtroppo però la meteo era davvero pessima per una
						gara tradizionale. Al massimo si poteva fare una planata.. Il colpo
						di genio fu di fare più planate… Una gara a eliminazione diretta: 5
						piloti alla volta, chi arriva primo passa il turno. Furono due
						giornate avvincenti! Era nato il mito della{" "}
						<strong>Halloween Cup!</strong>
						<br />
						Per offrire un po&apos; di contorno a piloti e pubblico, dato che si
						era a fine ottobre, gli abitanti di Semonzo avevano poi pensato di
						allestire a tema “Halloween” i giardini delle contrade ed ancora
						oggi, dopo dieci anni di crescita della manifestazione, i giardini
						di Halloween richiamano in paese centinaia di persone nella notte
						del 31 ottobre. <br />
						<br />
						Nel 2001 il club ha dato poi una grandissima prova di coesione e
						passione. Ad inizio anno si seppe che il meeting non si sarebbe più
						fatto. La gara era ancora nel calendario ufficiale ma c&apos;erano
						pochi mesi per organizzarla. Un enorme patrimonio di esperienze e
						tradizioni era a rischio e non fu possibile salvare l&apos;intera
						manifestazione. Grazie alla ferrea volontà del direttivo di allora
						però si riuscì a disputare comunque la gara di parapendio e
						dall&apos;anno successivo tornarono gli espositori e quindi anche i
						deltaplani. Da allora il club gestisce direttamente, con il supporto
						del consorzio Vivere il Grappa, una manifestazione che anno dopo
						anno ha ripreso a crescere e resta forse
						<strong>
							l&apos;unica al mondo a raggruppare negli stessi giorni di gara
							100 deltaplani e 130 parapendio.
						</strong>
						<br />
						<br />
						Nel 2004 arriva sempre in occasione del Trofeo Montegrappa una tappa
						del circuito di <strong>Coppa del Mondo parapendio</strong>,
						organizzata in collaborazione con il Delta Club Feltre. <br />
						<br />
						Siamo ormai ai giorni nostri. Edizione 2009 del trofeo Montegrappa,
						nuovamente il club si dimostra all&apos;avanguardia. Viene
						sperimentato per la prima volta nel volo libero il sistema{" "}
						<strong>&quot;Safly Live Traking&quot;</strong> su software Silent
						Wing, per seguire in diretta i concorrenti durante la competizione,
						come nelle gare di coppa America. E&apos; un ennesimo successo, con
						lo schermo preso d&apos;assalto da decine di piloti e appassionati,
						incollati al video per seguire la competizione. Il sistema sarà poi
						adottato anche per la finale di coppa del mondo, ma il debutto è
						stato qui! <br />
						<br />
						Nel 2009 tornano a Borso anche i{" "}
						<strong>campionati italiani di parapendio</strong> e viene
						organizzato pure il corso istruttori 2009. E la storia continua..
					</p>
					<div className="grid grid-cols-1 gap-4">
						<Image
							src="/storia/STORIA_1990.png"
							alt="STORIA_1990"
							width={500}
							height={400}
						/>
					</div>
				</div>
			),
		},
		{
			title: "2009 - 2014",
			content: (
				<div>
					<h1 className="mb-2 text-2xl font-bold italic">LA STORIA CONTINUA</h1>
					<p className="mb-8 text-neutral-800 dark:text-neutral-200">
						Cosa potevamo inventarci ancora? Pareva già tutto fatto un po&apos;
						come quando i piloti dicono “le vele moderne sono il top, come
						potranno mai migliorarle?” Effettivamente è stata dura riuscire
						anche solo a tenere gli standard raggiunti! <br />
						<br />
						Il <strong>Trofeo Expo Montegrappa</strong>, anche grazie
						all&apos;impegno di sponsor importanti come Infinity Fly, Garden
						Relais e Alpstation Bassano è cresciuto costantemente in quantità e
						qualità di piloti, espositori e presenze. È stata come di consueto
						una grande festa per gli amanti della nostra disciplina aprendosi
						anche ad altre attività sportive. Purtroppo però nel 2014 ha subito
						una improvvisa e radicale battuta d&apos;arresto. Non era mai
						successo dal 1979 che l&apos;appuntamento pasquale alle pendici del
						Grappa saltasse completamente ma questa volta il sormontarsi di una
						serie di problemi ci ha costretti a lasciare. Torneremo più forti di
						prima nel 2015, vedrete! <br />
						<br />
						Le gare sono da sempre un punto di forza del nostro club e fino al
						2012 a tenerne alto il nome è stato il{" "}
						<strong>Team Gare Montegrappa</strong>, composto da alcuni dei
						piloti più forti nel panorama nazionale. Ricchissimo il palmares di
						vittorie e piazzamenti tra i quali ricordiamo il titolo di Campione
						italiano nel 2008 a San Potito Sannitico, e nel 2009 proprio a Borso
						del Grappa, nel 2010 vice campione Italiano a Poggio Bustone e nel
						2011 di nuovo campione Italiano ad Assisi. <br />
						<br />
						Gli stessi piloti che vincono le gare più importanti si sono però
						anche resi disponibili come tutor per le giornate di Cross di
						gruppo, in cui ciascuno prende sotto la propria ala “gonfiabile” un
						paio di “pulcini” e li aiuta a crescere nel volo di distanza. <br />
						<br />
						Negli anni successivi il testimone del Team Gare viene raccolto dal{" "}
						<strong>Ravana Team</strong>, nato per scherzo da un gruppo di
						neobrevettati per sfidarsi al Triveneto, negli anni cresce al punto
						di vincerlo davvero il Triveneto, ovviamente sotto l&apos;egida
						dell&apos;AeC Montegrappa. <br />
						<br />E che dire dell&apos;impegno per la formazione e
						l&apos;aggiornamento?{" "}
						<strong>Nel 2009 la nostra zona ospita il corso istruttori</strong>{" "}
						a cui partecipano una trentina di esperti piloti. L&apos;anno
						successivo, assieme al Montegrappa Tandem Team, organizziamo il
						primo stage nazionale piloti tandem. Due giorni di intenso lavoro e
						confronto tra bipostisti provenienti da tutta Italia. Appuntamento
						che replicheremo nell&apos;autunno 2014. <br />
						<br />
						Nel frattempo cerchiamo di tenere attivi i soci anche nel periodo
						invernale. Grazie alla collaborazione con AlpStation Bassano Montura
						organizziamo degli incontri con alcuni dei più forti piloti al mondo
						Alex Ploner, pluricampione mondiale di deltaplano; Nicole Fedele e
						Jimmy Pacher, campioni europei e vincitori della coppa del mondo di
						parapendio; Michael Nesler, progettista di fama mondiale; Peter
						Gebhard, concorrente appena fuori dal podio alla X-Alps 2013. <br />
						<br />
						Nel 2011, proprio sulla scia del grande successo della Red Bull
						X-Alps, nasce la più nostrana{" "}
						<strong>
							X-Grasp. Al motto di “Chi bara ce l&apos;ha piccolo”{" "}
						</strong>
						facciamo una prova senza strumentazione: salita a piedi, breve
						percorso in volo e rientro al Garden nuovamente a piedi. Non ricordo
						i nomi dei vincitori, ma ci siamo divertiti un sacco. <br />
						<br />
						Ovviamente non di sole conferenze vive il pilota ed ecco quindi le
						gettonatissime feste in malga ed il{" "}
						<strong>campeggio volante</strong> (serata di festa con notte in
						tenda e volo mattutino). Un altro classico, saltato quest&apos;anno
						per problemi al campetto di Camol, è la giornata di prova
						organizzata con la ASD Manta, frequentata da decine e decine di
						curiosi che vogliono provare e diventata una festa per tutti i
						piloti che danno una mano e portano amici e parenti. Anche se il
						dubbio è che vengano più che altro per il minestrone di Franco…
						Cresciuta nel tempo anche la collaborazione proprio con la scuola
						Manta che, parallelamente al Montegrappa Tandem Team, completa il
						percorso di un aspirante pilota: il team lo infetta col virus del
						volo, la scuola lo cura e il club… lo mantiene sano e volante!! 🙂{" "}
						<br />
						<br />
						Un&apos;altra bella collaborazione è nata con il{" "}
						<strong>gruppo volo di San Floriano</strong>, che poi sono sempre
						soci dell&apos;AeC Montegrappa in trasferta. Ogni anno a fine estate
						anche qui si organizza una festa che diventa sempre grande (nel 2014
						c&apos;era pure la spina per la birra). <br />
						<br />
						Non tutti positivi purtroppo gli eventi che ci hanno visto
						protagonisti: in questi anni abbiamo anche dovuto lottare per
						conservare la possibilità di volare sul Grappa. Nonostante il grande
						afflusso di turismo e di lavoro che il volo genera, nella nostra
						zona ci sono ancora persone che provano a farci andar via e
						conservare i nostri spazi è spesso più difficile di quello che si
						possa pensare. Il Consorzio Turistico Vivere il Grappa oltre a
						collaborare con noi nelle belle occasioni ci affianca anche in
						queste battaglie! <br />
						<br />
						Ad ogni modo il bello dell&apos;AeC Montegrappa è quello di
						rigenerarsi continuamente, di avere forze nuove e desiderose di
						inventare nuovi modi per condividere la passione per il volo e
						divertirsi in compagnia. Ne sono prova, proprio nel 2014, le prime
						edizioni del <strong>CarnevalVolando</strong> a febbraio e del{" "}
						<strong>Tri-Grasp-Thlon</strong> proprio in occasione della festa
						sociale (evento clou di fine stagione). I gruppi e gli eventi vanno
						e vengono, meteore o stelle fisse dipende dal fato. Ma c&apos;è
						sempre qualcuno pronto a raccogliere il testimone e a proporre nuove
						idee. Cari soci: siete la nostra forza, grazie a tutti! …e la storia
						continua!
					</p>
					<div className="grid grid-cols-1 gap-4">
						<Image
							src="/storia/STORIA_2014.png"
							alt="STORIA_2014"
							width={500}
							height={400}
						/>
					</div>
				</div>
			),
		},
		{
			title: "2015 - 2019",
			content: (
				<div>
					<h1 className="mb-2 text-2xl font-bold italic">
						VOLI, SORRISI e UN ARRIVEDERCI
					</h1>
					<p className="mb-8 text-neutral-800 dark:text-neutral-200">
						Sono già passati 5 anni ed eccoci qui per l&apos;aggiornamento 2019!{" "}
						<br />
						<br />
						<strong>
							Nel 2015 torna il Trofeo Montegrappa con una grandiosa edizione di
							Expo presso le piscine Conca Verde.{" "}
						</strong>
						Purtroppo le difficoltà non sono finite e negli anni successivi
						abbiamo avuto parecchi problemi a organizzarlo. Ad aggravare la
						situazione il rapporto con AeCI si è andato deteriorando al punto
						che{" "}
						<strong>
							il Montegrappa è tornato ad essere ASD Volo libero Montegrappa.
						</strong>{" "}
						<br />
						L&apos;impegno però è stato premiato e nel 2019 abbiamo avuto una
						delle edizioni più memorabili della storia, con una task di quasi
						160 km nelle Dolomiti. <br />
						<br />
						Nel 2017 la nostra zona ha ospitato anche alcune manche del Mondiale
						di parapendio di Feltre, un grande successo dei nostri cugini.
						Onorando la propria tradizione (ne siamo stati tra i fondatori) il
						club ha ospitato ogni anni una tappa del Triveneto, se non la
						finale. Nel 2018 abbiamo avuto anche una tappa della Dolomiti
						Superfly. Il palmares dei nostri migliori piloti si arricchisce di
						vittorie e piazzamenti prestigiosi: nel 2017 Valentino Baù vince con
						la nazionale Italiana il Mondiale di deltaplano in Brasile, nel 2018
						Loris Berta si piazza secondo al Campionato Italiano di parapendio a
						Poggio Bustone e primo al Trofeo Guarnieri di Feltre (British Open).
						In fine Gianfranco Crestani arriva secondo al Trofeo Montegrappa
						2019 classe serial. <br />
						<br />
						Come oramai sapete però il club si occupa solo marginalmente di
						gare, il nostro vero target è il volo e il divertimento che esso può
						portare. Per esempio nel 2017 alla cena sociale abbiamo avuto in
						concerto Chiara Dello Iacovo, star di The Voice e Sanremo Giovani.
						La festa di fine estate “in trasferta” a Valle San Floriano diventa
						ogni anno più bella e coinvolge sempre nuovi amici. La festa sociale
						è l&apos;appuntamento più gettonato e il “premio pannocchia” uno dei
						più ambiti. <br />
						<br />
						In questi anni abbiamo curato anche la preparazione e
						l&apos;aggiornamento dei piloti. Nell&apos;elenco di questa parte
						figura l&apos;incontro con Marius Ganthaler che ci ha parlato del
						suo approccio diversamente abile al volo. Con la supervisione del
						Montegrappa Tandem Team nell&apos;autunno 2018 si è svolto il nuovo
						stage piloti biposto, organizzato nella cornice degli istituti
						Filippin di Paderno, che ha visto la partecipazione di 150 piloti
						provenienti da tutta Italia. Nel gennaio 2019 un intrigante e
						impegnativo corso sulla meteo e il volo di cross svolto al Garden
						Relais da Damiano Zanocco. <br />
						<br />
						Da segnalare anche la nascita di un nuovo gruppo di neobrevettati
						molto attivo. Nel 2017 sono nati i Parazoo che in soli due anni
						hanno già dato molto al club, non ultima una seconda festa a Valle
						San Floriano 🙂 <br />
						<br />
						In questi anni dopo l&apos;esperimento X-grasp e la più complessa e
						rinomata Tri-Grasp-Thlon l&apos;amore per l&apos;hike and fly è
						cresciuto anche da noi e sempre più spesso sui sentieri del Grappa
						si incontrano piloti più o meno sudati dotati di attrezzature meno o
						più leggere. <br />
						<br />
						Continua la “lotta” con la burocrazia per tenere aperto il sito di
						volo e di questo bisogna sicuramente ringraziare il Consorzio Vivere
						il Grappa per l&apos;aiuto che sta dando al nuovo consiglio
						direttivo del club. Una notizia simbolica molto positiva in questo
						senso: nel 2019 per la prima volta un sindaco di Borso (Flavio
						Dall&apos;Agnol) ha volato in tandem col parapendio e
						all&apos;atterraggio era molto contento! Se son rose fioriranno, ne
						avremmo davvero bisogno per sistemare finalmente i decolli in
						maniera decorosa. <br />
						<br />
						Nell&apos;estate del 2019 in collaborazione con la ASD Manta abbiamo
						festeggiato i i 40 anni del club e i 30 della scuola con una bella
						festa in piscina. <br />
						<br />
						Purtroppo dobbiamo concludere la narrazione di questo quinquennio
						con una notizia molto triste. Nel giugno 2018 infatti il nostro
						Flavio ci ha lasciato, vittima di un incidente di volo proprio nei
						cieli di Semonzo. È stato uno shock ma siamo certi che ora abbiamo{" "}
						<strong>un angelo in più a vegliare su tutti noi</strong>.
					</p>
					<div className="grid grid-cols-1 gap-4">
						<Image
							src="/storia/STORIA_2019.png"
							alt="STORIA_2019"
							width={500}
							height={400}
						/>
					</div>
				</div>
			),
		},
	];
	return (
		<div className="w-full">
			<Timeline data={data} />
		</div>
	);
}
