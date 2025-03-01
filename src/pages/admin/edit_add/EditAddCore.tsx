import React, { useState } from 'react';
import { Field, Formik, Form, FieldArray, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import ImageUploader from "./ImgDownloader";
import { Post } from "../../../entity/Entity";
import { EditPost } from "../../../api/Posts";
import ReactQuill from "react-quill";

type EditAddCoreProps = {
    publication: Post | null;
};

export const EditAddCore: React.FC<EditAddCoreProps> = ({ publication }) => {
    const [submitting, setSubmitting] = useState(false);

    const initialValues: Post = {
        _id: publication?._id || '',
        author_name: publication?.author_name || '',
        title: publication?.title || '',
        cards: publication?.cards || [],
        editor_name: publication?.editor_name || '',
        helpful_links: publication?.helpful_links || '',
        color: publication?.color || '#000000', // Default color black if not provided
        time_publication: formatDateTime(publication?.time_publication || '')
    };

    const publicationSchema = Yup.object().shape({
        author_name: Yup.string().required('Author name is required'),
        title: Yup.string().required('Title is required'),
        cards: Yup.array()
            .of(Yup.string().url('Must be a valid URL'))
            .min(1, 'At least one card URL is required'),
        editor_name: Yup.string().required('Editor name is required'),
        helpful_links: Yup.string().required('Helpful links are required'),
        color: Yup.string()
            .matches(/^#([0-9A-Fa-f]{6})$/, 'Color must be a valid hex code'),
        time_publication: Yup.string().required('Publication time is required')
    });

    return (
        <>
            <ImageUploader />
            <Formik
                validationSchema={publicationSchema}
                initialValues={initialValues}
                onSubmit={async (values) => {
                    try {
                        setSubmitting(true);
                        values.time_publication = formatDateTimeForAPI(values.time_publication);
                        await EditPost(values);
                        setSubmitting(false);
                    } catch (e) {
                        console.error(e);
                        setSubmitting(false);
                    }
                }}
            >
                {({ values, isSubmitting }) => (
                    <Form>
                        <h1>Edit Publication</h1>

                        <label htmlFor="author_name">Author Name:</label>
                        <Field name="author_name">
                            {/* @ts-ignore*/}
                            {({ field, form }) => (
                                <ReactQuill
                                    value={field.value}
                                    onChange={(content) => form.setFieldValue("author_name", content)}
                                />
                            )}
                        </Field>
                        <ErrorMessage name="author_name" component="div" className="error"/>
                        <p></p>

                        <label htmlFor="title">Title:</label>
                        <Field name="title" type="text"/>
                        <ErrorMessage name="title" component="div" className="error"/>
                        <p></p>

                        <label htmlFor="editor_name">Editor Name:</label>
                        <Field name="editor_name">
                            {/* @ts-ignore*/}
                            {({ field, form }) => (
                                <ReactQuill
                                    value={field.value}
                                    onChange={(content) => form.setFieldValue("editor_name", content)}
                                />
                            )}
                        </Field>
                        <ErrorMessage name="editor_name" component="div" className="error"/>
                        <p></p>

                        <label htmlFor="helpful_links">Helpful Links:</label>
                        <Field name="helpful_links">
                            {/* @ts-ignore*/}
                            {({ field, form }) => (
                                <ReactQuill
                                    value={field.value}
                                    onChange={(content) => form.setFieldValue("helpful_links", content)}
                                />
                            )}
                        </Field>
                        <ErrorMessage name="helpful_links" component="div" className="error"/>
                        <p></p>

                        <label htmlFor="color">Color:</label>
                        <Field name="color">
                            {/* @ts-ignore*/}
                            {({ field, form }) => (
                                <input
                                    type="color"
                                    {...field}
                                    onChange={(event) => form.setFieldValue("color", event.target.value)}
                                    style={{ width: "50px", height: "30px", border: "none" }}
                                />
                            )}
                        </Field>
                        <ErrorMessage name="color" component="div" className="error"/>
                        <p></p>

                        <label htmlFor="time_publication">Publication Time:</label>
                        <Field name="time_publication" type="datetime-local"/>
                        <div><ErrorMessage name="time_publication" component="div" className="error"/></div>
                        <p></p>

                        <h2>Cards</h2>
                        <FieldArray
                            name="cards"
                            render={arrayHelpers => (
                                <div>
                                    {values.cards.map((card, index) => (
                                        <div key={index}>
                                            <label htmlFor={`cards.${index}`}>Card URL {index + 1}:</label>
                                            <Field name={`cards.${index}`} type="text"/>
                                            <ErrorMessage name={`cards.${index}`} component="div" className="error"/>
                                            <button type="button" onClick={() => arrayHelpers.remove(index)}>Remove</button>
                                            <p></p>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => arrayHelpers.push('')}>Add Card</button>
                                </div>
                            )}
                        />

                        {isSubmitting && <div className="error">Submission failed. Please check the form for errors.</div>}

                        {!submitting && <button type="submit">Submit</button>}
                    </Form>
                )}
            </Formik>
        </>
    );
};

const formatDateTime = (dateTime: string) => {
    if (!dateTime) return '';
    return dateTime.slice(0, 16); // Removes seconds and timezone
};

const formatDateTimeForAPI = (dateTime: string) => {
    if (!dateTime) return '';
    return new Date(dateTime).toISOString();
};
