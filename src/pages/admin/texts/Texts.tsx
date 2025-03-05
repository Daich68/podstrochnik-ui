import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { GetTexts, UpdateText } from "../../../api/Posts";
import { TextsData } from "../../../entity/Entity";
import { MenuAdmin } from "../main/MenuAdmin";

export const Texts: React.FC = () => {
    const [texts, setTexts] = useState<TextsData[]>([]);

    useEffect(() => {
        GetTexts()
            .then((data) => {
                setTexts(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, []);

    const handleEditTexts = (values: Record<string, string>) => {
        const updatedTexts = texts.map((text) => ({
            ...text,
            value: values[text.location_key], // Update values correctly
        }));

        Promise.all(updatedTexts.map((text) => UpdateText(text)))
            .then(() => {
                console.log("Texts updated successfully");
            })
            .catch((error) => {
                console.error("Failed to update texts:", error);
            });
    };

    return (
        <div className="admin-ui">
            <MenuAdmin />
            <div className="translations-container">
                <Formik
                    initialValues={texts.reduce((acc, text) => {
                        acc[text.location_key] = text.value; // Create structured object
                        return acc;
                    }, {} as Record<string, string>)}
                    onSubmit={handleEditTexts}
                    enableReinitialize
                >
                    {({ values, setFieldValue }) => (
                        <Form>
                            <table className="translations-table">
                                <thead>
                                <tr>
                                    <th>Key</th>
                                    <th>Value</th>
                                </tr>
                                </thead>
                                <tbody>
                                {texts.map((text) => (
                                    <tr key={text._id}>
                                        <td>{text.location_key}</td>
                                        <td>
                                            <ReactQuill
                                                value={values[text.location_key]}
                                                onChange={(content) => setFieldValue(text.location_key, content)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                            <button type="submit">Save All Changes</button>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
};

export default Texts;
