import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { NEXT_YEAR } from "@/config/constants";

const COPY = {
	it: {
		preview: "Conferma la tua email",
		title: "Conferma la tua email",
		greeting: "Ciao",
		body: "per completare l'iscrizione a Volo Libero Montegrappa conferma il tuo indirizzo email cliccando il pulsante qui sotto.",
		next: "Subito dopo ti chiederemo di completare il tuo profilo pilota.",
		button: "Conferma email",
		expiry: "Il link è valido per 24 ore.",
		ignore: "Se non hai creato un account, ignora questa email.",
	},
	en: {
		preview: "Confirm your email",
		title: "Confirm your email",
		greeting: "Hi",
		body: "to complete your Volo Libero Montegrappa registration, please confirm your email address by clicking the button below.",
		next: "Right after that we will ask you to complete your pilot profile.",
		button: "Confirm email",
		expiry: "The link is valid for 24 hours.",
		ignore: "If you did not create an account, please ignore this email.",
	},
};

export type VerifyEmailLanguage = keyof typeof COPY;

export function VerifyEmail({
	firstName,
	url,
	language,
}: {
	firstName: string;
	url: string;
	language: VerifyEmailLanguage;
}) {
	const copy = COPY[language];
	return (
		<Html>
			<Tailwind>
				<Head />
				<Preview>{copy.preview}</Preview>
				<Body style={main}>
					<Container>
						<Section style={logo}>
							<Img
								style={{ margin: "auto" }}
								src="https://www.vololiberomontegrappa.it/logo/LOGO_COLOR.png"
								width={284}
								height={39}
							/>
						</Section>
						<Section style={content}>
							<Row style={{ ...boxInfos, paddingBottom: "0" }}>
								<Column>
									<Row>
										<Text className="text-center text-[24px] font-semibold leading-[32px]">
											{copy.title}
										</Text>
									</Row>
									<Row>
										<Text>
											{copy.greeting} {firstName}, <br />
											{copy.body}
										</Text>
										<Text>{copy.next}</Text>
									</Row>
									<Row>
										<Button
											className="box-border w-full rounded-[8px] bg-blue-600 p-[12px] text-center font-semibold text-white"
											href={url}
										>
											{copy.button}
										</Button>
									</Row>
									<Row>
										<Text className="text-center">
											{copy.expiry}
											<br />
											{copy.ignore}
										</Text>
									</Row>
								</Column>
							</Row>
						</Section>
						<Text
							style={{
								textAlign: "center",
								fontSize: 12,
								color: "rgb(0,0,0, 0.7)",
							}}
						>
							© {NEXT_YEAR} | ASD Volo Libero Montegrappa |{" "}
							<Link href="https://www.vololiberomontegrappa.it">
								www.vololiberomontegrappa.it
							</Link>
						</Text>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
}

const main = {
	backgroundColor: "#fff",
	fontFamily:
		'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const logo = {
	padding: "30px 20px",
};

const content = {
	border: "1px solid rgb(0,0,0, 0.1)",
	borderRadius: "3px",
	overflow: "hidden",
};

const boxInfos = {
	padding: "20px",
};
