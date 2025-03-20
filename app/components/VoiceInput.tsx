"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceInputProps {
	onTranscript: (transcript: string) => void;
	disabled: boolean;
}

export default function VoiceInput({
	onTranscript,
	disabled,
}: VoiceInputProps) {
	const [isListening, setIsListening] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [audioLevel, setAudioLevel] = useState(0);
	const recognitionRef = useRef<any>(null);
	const userAbortedRef = useRef(false);
	const audioContextRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const microphoneStreamRef = useRef<MediaStream | null>(null);
	const animationFrameRef = useRef<number | null>(null);

	useEffect(() => {
		// Check if browser supports SpeechRecognition
		if (
			typeof window !== "undefined" &&
			!("webkitSpeechRecognition" in window) &&
			!("SpeechRecognition" in window)
		) {
			setErrorMessage("Voice recognition not supported in this browser");
			return;
		}

		// Initialize speech recognition
		if (typeof window !== "undefined") {
			const SpeechRecognition =
				(window as any).SpeechRecognition ||
				(window as any).webkitSpeechRecognition;

			if (SpeechRecognition) {
				recognitionRef.current = new SpeechRecognition();
				const recognition = recognitionRef.current;
				recognition.continuous = false;
				recognition.interimResults = true;
				recognition.lang = "en-US";

				recognition.onresult = (event: any) => {
					const transcript = event.results[0][0].transcript;
					console.log("Speech recognized:", transcript);
					onTranscript(transcript);
					if (event.results[0].isFinal) {
						setIsListening(false);
						stopAudioMonitoring();
					}
				};

				recognition.onerror = (event: any) => {
					// Only log errors that aren't from user-initiated aborts
					if (event.error === "aborted" && userAbortedRef.current) {
						userAbortedRef.current = false;
						return;
					}

					console.error("Speech recognition error", event.error);
					setErrorMessage(`Error: ${event.error}`);
					setIsListening(false);
					stopAudioMonitoring();
				};

				recognition.onend = () => {
					setIsListening(false);
					stopAudioMonitoring();
				};
			}
		}

		return () => {
			if (recognitionRef.current) {
				userAbortedRef.current = true;
				recognitionRef.current.abort();
			}
			stopAudioMonitoring();
		};
	}, [onTranscript]);

	const startAudioMonitoring = async () => {
		try {
			// Request microphone access
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: true,
			});
			microphoneStreamRef.current = stream;

			// Create audio context and analyser
			const AudioContext =
				window.AudioContext || (window as any).webkitAudioContext;
			audioContextRef.current = new AudioContext();
			analyserRef.current = audioContextRef.current.createAnalyser();

			// Connect microphone to analyser
			const source =
				audioContextRef.current.createMediaStreamSource(stream);
			source.connect(analyserRef.current);

			// Configure analyser
			analyserRef.current.fftSize = 256;
			const bufferLength = analyserRef.current.frequencyBinCount;
			const dataArray = new Uint8Array(bufferLength);

			// Start monitoring audio levels
			const updateAudioLevel = () => {
				if (!analyserRef.current) return;

				analyserRef.current.getByteFrequencyData(dataArray);
				let sum = 0;
				for (let i = 0; i < bufferLength; i++) {
					sum += dataArray[i];
				}
				const average = sum / bufferLength;
				const level = Math.min(1, average / 128); // Normalize to 0-1
				setAudioLevel(level);

				animationFrameRef.current =
					requestAnimationFrame(updateAudioLevel);
			};

			updateAudioLevel();
		} catch (error) {
			console.error("Error accessing microphone:", error);
			setErrorMessage("Could not access microphone");
		}
	};

	const stopAudioMonitoring = () => {
		if (animationFrameRef.current) {
			cancelAnimationFrame(animationFrameRef.current);
			animationFrameRef.current = null;
		}

		if (microphoneStreamRef.current) {
			microphoneStreamRef.current
				.getTracks()
				.forEach((track) => track.stop());
			microphoneStreamRef.current = null;
		}

		if (audioContextRef.current) {
			audioContextRef.current.close().catch(console.error);
			audioContextRef.current = null;
		}

		analyserRef.current = null;
		setAudioLevel(0);
	};

	const toggleListening = async () => {
		if (disabled) return;

		if (isListening) {
			userAbortedRef.current = true;
			recognitionRef.current?.abort();
			setIsListening(false);
			stopAudioMonitoring();
		} else {
			userAbortedRef.current = false;
			setErrorMessage(null);
			try {
				await startAudioMonitoring();
				recognitionRef.current?.start();
				setIsListening(true);
				console.log("Started listening for speech input");
			} catch (error) {
				console.error("Error starting speech recognition:", error);
				setErrorMessage("Failed to start speech recognition");
				stopAudioMonitoring();
			}
		}
	};

	// Calculate the size of audio level indicator bars
	const getBarHeight = (index: number, maxHeight: number = 16) => {
		// Create a wave-like pattern with 5 bars
		const centerBar = index === 2;
		const adjacentBar = index === 1 || index === 3;

		if (centerBar) {
			return Math.round(audioLevel * maxHeight);
		} else if (adjacentBar) {
			return Math.round(audioLevel * maxHeight * 0.8);
		} else {
			return Math.round(audioLevel * maxHeight * 0.6);
		}
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={toggleListening}
				disabled={disabled || !recognitionRef.current}
				className={`p-3 rounded-full transition-colors duration-200 ${
					isListening
						? "bg-red-500 hover:bg-red-600"
						: "bg-[var(--primary)] hover:bg-[var(--primary-dark)]"
				} text-white disabled:opacity-50 disabled:cursor-not-allowed`}
				title={isListening ? "Stop listening" : "Start voice input"}>
				{isListening ? (
					<span className="h-4 w-4 block">■</span>
				) : (
					<span className="h-4 w-4 block">🎤</span>
				)}
			</button>

			{errorMessage && (
				<div className="absolute bottom-full mb-2 text-sm text-red-500 whitespace-nowrap">
					{errorMessage}
				</div>
			)}

			{isListening && (
				<div className="absolute bottom-full mb-2 text-sm text-green-500 whitespace-nowrap flex flex-col items-center">
					<div className="flex items-end h-4 gap-[2px] mb-1">
						{[0, 1, 2, 3, 4].map((i) => (
							<div
								key={i}
								className="w-1 bg-green-500 rounded-t"
								style={{
									height: `${getBarHeight(i)}px`,
									transition: "height 0.1s ease-in-out",
								}}
							/>
						))}
					</div>
					<span>Listening...</span>
				</div>
			)}
		</div>
	);
}
