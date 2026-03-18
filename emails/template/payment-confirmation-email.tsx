import {
	Body,
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
import type { Payment, User } from "@/prisma/generated/client";

type Props = {
	user: User;
	payment: Payment;
	couponCode: string;
};

export function PaymentConfirmationEmail({ user, payment, couponCode }: Props) {
	return (
		<Html>
			<Tailwind>
				<Head />
				<Preview>Conferma Iscrizione</Preview>
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
									<Text>Ciao {user.firstName},</Text>
									<Text>
										Grazie per esserti iscritto come Socio {NEXT_YEAR} al Club
										Volo Libero Montegrappa!
									</Text>
									<Text>
										Puoi rivedere e modificare i tuoi dati di iscrizione qui:{" "}
										<br />
										<Link href="https://www.vololiberomontegrappa.it/profile">
											www.vololiberomontegrappa.it/profile
										</Link>
									</Text>
									<Text>
										Il tuo codice coupon per l&apos;acquisto della flycard è:{" "}
										<b>{couponCode}</b>
									</Text>
									<Text>
										Usa questo codice per ottenere uno sconto sull&apos;acquisto
										della flycard (10euro) sul sito{" "}
										<a href="https://flycard.vivereilgrappa.it/">
											www.flycard.vivereilgrappa.it
										</a>
									</Text>

									<Text>Ecco i tuoi dati di pagamento:</Text>
									<Text>
										<b>Pagato con:</b>{" "}
										{getPaymentMethod(
											payment.stripePaymentMethod || payment.paymentMethod,
										)}{" "}
										<br />
										<b>Nome del piano di iscrizione:</b> {payment.description}{" "}
										<br />
										<b>Totale:</b> {(payment.amount / 100).toFixed(2)} EUR{" "}
										<br />
										<b>Ricevuta:</b>{" "}
										{payment.stripeReceiptUrl && (
											<Link href={payment.stripeReceiptUrl}>Link Ricevuta</Link>
										)}
									</Text>
									<Text>Buoni voli! 🪂</Text>
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

function getPaymentMethod(paymentMethod?: string | null) {
	if (!paymentMethod) return;
	const paymentMethods: Record<string, string> = {
		revolut_pay: "Revolut Pay",
		card: "Carta di Credito",
		apple_pay: "Apple Pay",
		google_pay: "Google Pay",
		bancontact: "Bancontact",
		cash: "Contanti",
		bank_transfer: "Bonifico Bancario",
	};
	return paymentMethods[paymentMethod] || paymentMethod;
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

const _image = {
	maxWidth: "100%",
};

const boxInfos = {
	padding: "20px",
};

const _paragraph = {
	fontSize: 16,
};
