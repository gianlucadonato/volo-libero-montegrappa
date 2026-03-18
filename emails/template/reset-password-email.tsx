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

import { env } from "@/env";

export function ResetPasswordEmail({
	user,
	token,
}: {
	user: { firstName: string; state: string | null };
	token: string;
}) {
	const baseUrl = env.NEXT_PUBLIC_APP_URL;
	const language = user.state === "ITA" ? "it" : "en";
	return (
		<Html>
			<Tailwind>
				<Head />
				<Preview>Reset Password</Preview>
				<Body style={main}>
					<Container>
						<Section style={logo}>
							<Img
								style={{ margin: "auto" }}
								src="https://vololiberomontegrappa.it/logo/LOGO_COLOR.png"
								width={284}
								height={39}
							/>
						</Section>
						<Section style={content}>
							<Row style={{ ...boxInfos, paddingBottom: "0" }}>
								{language === "it"
									? getEmailContentIT({ user, token, baseUrl })
									: getEmailContentEN({ user, token, baseUrl })}
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

function getEmailContentEN({
	user,
	token,
	baseUrl,
}: {
	user: { firstName: string };
	token: string;
	baseUrl: string;
}) {
	return (
		<Column>
			<Row>
				<Text className="leading-[32px text-center text-[24px] font-semibold">
					Reset Password
				</Text>
			</Row>
			<Row>
				<Text>
					Hi {user.firstName}, <br />
					we&apos;re sending you this email because you requested a password
					reset.
				</Text>
				<Text>Click the link below to create a new password:</Text>
			</Row>
			<Row>
				<Button
					className="box-border w-full rounded-[8px] bg-blue-600 p-[12px] text-center font-semibold text-white"
					href={`${baseUrl}/new-password?token=${token}`}
				>
					Set a new password
				</Button>
			</Row>
			<Row>
				<Text className="text-center">
					If you didn&apos;t request a password reset, please ignore this email.{" "}
					<br />
					Your password will not be changed.
				</Text>
			</Row>
		</Column>
	);
}

function getEmailContentIT({
	user,
	token,
	baseUrl,
}: {
	user: { firstName: string };
	token: string;
	baseUrl: string;
}) {
	return (
		<Column>
			<Row>
				<Text className="text-center text-[24px] font-semibold leading-[32px]">
					Reset Password
				</Text>
			</Row>
			<Row>
				<Text>
					Ciao {user.firstName}, <br />
					abbiamo inviato questa email perché hai richiesto un reset della
					password.
				</Text>
				<Text>Clicca il link qui sotto per creare una nuova password:</Text>
			</Row>
			<Row>
				<Button
					className="box-border w-full rounded-[8px] bg-blue-600 p-[12px] text-center font-semibold text-white"
					href={`${baseUrl}/new-password?token=${token}`}
				>
					Imposta una nuova password
				</Button>
			</Row>
			<Row>
				<Text className="text-center">
					Se non hai richiesto un reset della password, ignora questa email.
					<br />
					La tua password non verrà modificata.
				</Text>
			</Row>
		</Column>
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
